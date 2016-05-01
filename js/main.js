const fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');

var UnitPriceApp = React.createClass ({
  getDefautProps: function() {
    return { isLoggedIn: null }
  },
  componentDidMount: function() {
    //console.log("UnitPriceApp DidMount");
    fireBaseURL.onAuth(this.setAuth);
  },
  componentDidUpdate: function() {
    //console.log("UnitPriceApp DidUpdate");
    var authState = this.props.isLoggedIn;
    if (authState) {
      let userRef = fireBaseURL.child('users');
      userRef.child(authState.uid).update({
        lastLoggedIn: Firebase.ServerValue.TIMESTAMP
      });
      ReactDOM.render(
        <MainMenu userAuth={ authState } />,
        document.getElementById('appContainer')
      );
    } else {
      ReactDOM.render(
        <LoginBox />,
        document.getElementById('appContainer')
      );
    }
  },
  setAuth: function(authData) {
    ReactDOM.render(
      <UnitPriceApp isLoggedIn={ authData } />,
      document.getElementById('content')
    );
    if (authData) {
      console.log("User " + authData.uid + " is logged in with " + authData.provider);
    } else {
      console.log("User is logged out");
    }
  },
  render: function() {
    return (<div id="appContainer" />);
  }
});

var LoginBox = React.createClass({
  render: function() {
    return (
        <div id="loginBox">
            <LoginForm />
        </div>
    );
  }
});

var LoginForm = React.createClass({
  getInitialState: function() {
    return { loginName: '', password: '' };
  },
  handleLoginChange: function(e) {
    this.setState({ loginName: e.target.value });
  },
  handlePassChange: function(e) {
    this.setState({ password: e.target.value });
  },
  handleSubmit: function(e) {
    var self = this;
    e.preventDefault();
    var userN = this.state.loginName.trim();
    var pass = this.state.password;
    fireBaseURL.authWithPassword({
      email: userN,
      password: pass
    }, function(error, authData){
      if (!error) {
        console.log("Authenticated successfully with payload:", authData);
        ReactDOM.render(  // Load MainMenu
          <MainMenu userAuth={ authData }/>,
          document.getElementById('appContainer')
        );
      } else {
          self.setState({loginName: '', password: ''});  // Clear state
          console.log("Login Failed!", error);  // Error message
      }
    })
  },
  handleCreateAcct: function(e) {
    e.preventDefault();
    ReactDOM.render(  // Load Create Account page
      <CreateAcct />,
      document.getElementById('appContainer')
    );
  },
  render: function() {
    return (
      <div id="loginContainer" className="row">
        <div className="medium-6 medium-centered large-4 large-centered columns">
          
          <form>
            <div className="user-form">
              <h4 className="text-center">Log in to UnitPrice</h4>
              <label>Email
                <input
                  type="email"
                  id="loginName"
                  autoFocus
                  placeholder="email@someplace.com"
                  value={this.state.loginName}
                  onChange={this.handleLoginChange}
                />
              </label>
              <label>Password
                <input
                  type="password"
                  id="pswrd"
                  placeholder="Shhh! It's a secret"
                  value={this.state.password}
                  onChange={this.handlePassChange}
                />
              </label>
                <p><a onClick={this.handleSubmit} type="submit" className="button expanded">Log In</a></p>
                
              </div>
            </form>
            <hr />
            <div id="createBtnContainer">
              <p><a onClick={this.handleCreateAcct}  type="button" id="createAcctBtn" className="button expanded">Create a New Account</a></p>
            </div>
        </div>
      </div> 
    );
  }
});

var CreateAcct = React.createClass({
  getInitialState: function() {
    return {
      email: '',
      password: '',
      password2: '',
      username: ''
    };
  },
  handleEmailChange: function(e) {
    this.setState({ email: e.target.value, error: { vis: false } });
  },
  handlePassChange: function(e) {
    this.setState({ password: e.target.value, error: { vis: false } });
  },
  handlePassChange2: function(e) {
    this.setState({ password2: e.target.value, error: { vis: false } });
  },
  handleUserChange: function(e) {
    this.setState({ username: e.target.value, error: { vis: false } });
  },
  handleSubmit: function(e) {
    var self = this;
    e.preventDefault();
    console.log("Attempting to create user account for ", this.state.email);
    var usersTable = fireBaseURL.child('users');
    /* Check if username is taken */    
    if ( this.checkUsernameExists(this.state.username, usersTable) ) {
      var message = 'Sorry, username: ' + this.state.username + 'is taken';
      console.log(message);
    /* Check if passwords Match */
    } else if (this.state.password != this.state.password2) {
      console.log('Passwords do not match');
    } else {
      /* create user in Firebase */
      fireBaseURL.createUser({
        email    : this.state.email,
        password : this.state.password
      }, function(error, userData) {
        if (error) {
          console.log(error);
        } else {
          /* login with password */
          fireBaseURL.authWithPassword({
            email    : self.state.email,
            password : self.state.password
          }, function() {
            // TODO: handle auth errors
            return;
          });
          /* record user info to user table */
          self.createUser(userData);
          /* clear form/state */
          self.setState({
            email: '',
            password: '',
            password2: '',
            username: ''
          });
          console.log("Successfully created user account with uid:", userData.uid);
          console.log(userData);
        }
      });
    }
  },
  createUser: function(userData) {
      var self = this;
      var usersTable = fireBaseURL.child('users');
      usersTable.child(userData.uid).set({
        username: self.state.username,
        email: self.state.email,
        date_created: Firebase.ServerValue.TIMESTAMP 
      });
      return true;
  },
  // TODO: refactor this to be reusable to check for anything with a child path
  checkUsernameExists: function (username, usersTable) {
    usersTable.orderByChild("username").equalTo(username).once("value", function(snapshot) {
      return (snapshot.val() !== null);
    });
  },
  render: function() {
    return (
      <div id="loginContainer" className="row">
        <div className="medium-6 medium-centered large-4 large-centered columns">
          <form>
            <div className="user-form">
              <h4 className="text-center">Create your Account</h4>
                <label>Choose a Username
                  <input 
                    type="text"
                    id="username"
                    autoFocus
                    placeholder="Kickass code name"
                    value={this.state.username}
                    onChange={this.handleUserChange}
                  />
                </label>
                <label>Email
                  <input
                    type="email"
                    id="email"
                    placeholder="email@someplace.com"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                  />
                </label>
                <label>Password
                  <input
                    type="password"
                    id="pswrd"
                    placeholder="Make it hard to guess"
                    value={this.state.password}
                    onChange={this.handlePassChange}
                  />
                </label>
                <label>Confirm Password
                  <input
                    type="password"
                    id="pswrd"
                    placeholder="but you still need to remember it"
                    value={this.state.password2}
                    onChange={this.handlePassChange2}
                  />
                </label>
                <p><a onClick={this.handleSubmit} type="submit" className="button expanded">Create Account and Login</a></p>
            </div>
          </form>
        </div>
      </div>
    )
  }
});

var MainMenu = React.createClass({
  logoutCurrentUser: function(e, uid) {
    e.preventDefault();
    let userRef = fireBaseURL.child('users');
      userRef.child(this.props.userAuth.uid).update({
        lastLoggedOut: Firebase.ServerValue.TIMESTAMP
      });
    fireBaseURL.unauth();
  },
  changePass: function(e) {
    e.preventDefault();
    console.log(this.props.userAuth);
    ReactDOM.render(
      <ChangePass userAuth={ this.props.userAuth } />,
      document.getElementById('page-holder')
    );
  },
  render: function() {
    return (
      <div className="mainMenu row">
        <div className="medium-6 medium-centered large-4 large-centered columns">
          <h2>Main Menu</h2>
          <ul>
            <li><a href='' onClick={ this.changePass }>Change my password</a></li>
            <li><a href='' onClick={ this.logoutCurrentUser }>Logout { this.props.userAuth.uid }</a></li>
            <hr />
          </ul>
          <div id="page-holder" />
        </div>
      </div>
    );
  }
});

var ChangePass = React.createClass({
  getInitialState: function() {
    return { oldPass: '', newPass: '', newPass2: '' };
  },
  handleOldPass: function(e) {
    this.setState({ oldPass: e.target.value });
  },
  handlePassChange: function(e) {
    this.setState({ newPass: e.target.value });
  },
  handlePass2Change: function(e) {
    this.setState({ newPass2: e.target.value });
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var self = this;
    var emailRef = fireBaseURL.child('users').child(this.props.userAuth.uid).child('email');
    console.log(emailRef);
    emailRef.once("value", function(snapshot) {
      console.log(snapshot);
      if (self.state.newPass != self.state.newPass2) {
        console.log("New Passwords do not match!");
      } else {
        fireBaseURL.changePassword({
          email       : snapshot.val(),
          oldPassword : self.state.oldPass,
          newPassword : self.state.newPass
        }, function(error) {
          if (error === null) {
            console.log("Password changed successfully");
          } else {
            console.log("Error changing password:", error);
          }
        });
      }
    self.setState({ oldPass: '', newPass: '', newPass2: '' });
    }); 
  },
  render: function() {
    // TODO: Add title and error div to the page
    return (
      <div id="changePassContainer" className="row">
        <div className="small-12 columns">
          
          <form>
            <div className="user-form">
              <h4 className="text-center">Change your password</h4>
              <label>Old password
                <input
                  type="password"
                  id="oldPswrd"
                  autoFocus
                  value={this.state.oldPass}
                  onChange={this.handleOldPass}
                  />
              </label>
              <label>New Password
                <input
                type="password"
                id="newPswrd"
                placeholder="Enter your new password"
                value={this.state.newPass}
                onChange={this.handlePassChange}
              />
              </label>
              <label>
                <input
                  type="password"
                  id="oldPswrd"
                  placeholder="Confirm new password"
                  value={this.state.newPass2}
                  onChange={this.handlePass2Change}
                />
              </label>
              <p><a onClick={this.handleSubmit} type="submit" className="button expanded">Change Password</a></p>
            </div>
          </form>
        </div>
      </div> 
    );
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);
