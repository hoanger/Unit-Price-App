const fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');

var UnitPriceApp = React.createClass ({
/*getInitialState: function() {
    return { isLoggedIn: '' };
  }, */
  getDefautProps: function() {
    return { isLoggedIn: null }
  },
  componentDidMount: function() {
    console.log("UnitPriceApp DidMount");
    fireBaseURL.onAuth(this.setAuth);
  },
  componentDidUpdate: function() {
    console.log("UnitPriceApp DidUpdate");
    var authState = this.props.isLoggedIn;
    ReactDOM.unmountComponentAtNode(document.getElementById('appContainer'));
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
        <div className="loginBox">
            <h1>Unit Price Login</h1>
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
        ReactDOM.unmountComponentAtNode(document.getElementById('appContainer')); // Unmount loginbox
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
    ReactDOM.unmountComponentAtNode(document.getElementById('appContainer')); // Unmount loginbox
    ReactDOM.render(  // Load Create Account page
      <CreateAcct />,
      document.getElementById('appContainer')
    );
  },
  render: function() {
    return (
      <div id="loginContainer">
        <form className="loginForm" onSubmit={this.handleSubmit} >
          <p>
            <input
              type="text"
              id="loginName"
              placeholder="Email Address"
              value={this.state.loginName}
              onChange={this.handleLoginChange}
              autofocus
            />
          </p>
          <p>
            <input
              type="password"
              id="pswrd"
              placeholder="Password"
              value={this.state.password}
              onChange={this.handlePassChange}
            />
          </p>
            <input
              type="submit"
              id="loginBtn"
              value="Sign In"
              disabled={ (this.state.userName === '') || (this.state.password ==='') }
            />
        </form>
        <hr />
        <div id="createBtnContainer">
          <input
            type="button"
            id="createAcct"
            value="Create a New Account"
            onClick={this.handleCreateAcct}
          />
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
      username: '',
      error: {
        vis: false,
        msg: ''
      }
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
      this.setState({ error: { vis: true, msg: message } });
    /* Check if passwords Match */
    } else if (this.state.password != this.state.password2) {
      this.setState({ error: { vis: true, msg: 'Passwords do not match' } });
    } else {
      /* create user in Firebase */
      fireBaseURL.createUser({
        email    : this.state.email,
        password : this.state.password
      }, function(error, userData) {
        if (error) {
          console.log("Error creating user:", error);
          self.setState({ error: { vis: true, msg: error }, password: '', password2: '' });
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
            username: '',
            error: {
              vis: false,
              msg: ''
            }
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
      <div className="createAcct">
        <h1>Create an Account</h1>
        <div className="errorMsg" visible={ this.state.error.vis }>{ this.state.error.msg }</div>
        <form className="createAcctForm" onSubmit={this.handleSubmit}>
          <p>
            <input
              type="text"
              id="email"
              placeholder="Email Address"
              value={this.state.email}
              onChange={this.handleEmailChange}
              autofocus
            />
          </p>
          <p>
            <input
              type="password"
              id="pswrd"
              placeholder="Password"
              value={this.state.password}
              onChange={this.handlePassChange}
            />
          </p>
          <p>
            <input
              type="password"
              id="pswrd"
              placeholder="Confirm password"
              value={this.state.password2}
              onChange={this.handlePassChange2}
            />
          </p>
          <p>
            <input
              type="text"
              id="username"
              placeholder="User Name"
              value={this.state.username}
              onChange={this.handleUserChange}
            />
          </p>
          <p>
            <input
              type="submit"
              id="createBtn"
              value="Create Account and Login"
            />
          </p>
        </form>
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
    ReactDOM.unmountComponentAtNode(document.getElementById('appContainer'));
    ReactDOM.render(
      <ChangePass userAuth={ this.props.userAuth } />,
      document.getElementById('appContainer')
    );
  },
  render: function() {
    return (
        <div className="mainMenu">
          <h1>Main Menu</h1>
          <ul>
            <li><a href='' onClick={ this.changePass }>Change my password</a></li>
            <li><a href='' onClick={ this.logoutCurrentUser }>Logout { this.props.userAuth.uid }</a></li>
          </ul>
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
            ReactDOM.unmountComponentAtNode(document.getElementById('appContainer')); // Unmount loginbox
            ReactDOM.render(  // Load MainMenu
              <MainMenu userAuth={ self.props.userAuth }/>,
              document.getElementById('appContainer')
            );
          } else {
            console.log("Error changing password:", error);
            self.setState({ oldPass: '', newPass: '', newPass2: '' });
          }        
        });
      }
    }); 
  },
  render: function() {
    // TODO: Add title and error div to the page
    return (
      <div id="changePassContainer">
        <form className="changePassForm" onSubmit={this.handleSubmit} >
          <p>
            <input
              type="password"
              id="oldPswrd"
              placeholder="Old Password"
              value={this.state.oldPass}
              onChange={this.handleOldPass}
            />
          </p>
          <p>
            <input
              type="password"
              id="newPswrd"
              placeholder="New Password"
              value={this.state.newPass}
              onChange={this.handlePassChange}
            />
          </p>
          <p>
            <input
              type="password"
              id="oldPswrd"
              placeholder="Retype new Password"
              value={this.state.newPass2}
              onChange={this.handlePass2Change}
            />
          </p>
          <input
              type="submit"
              id="changePassBtn"
              value="Change Password"
              disabled={ (this.state.oldPass === '') || (this.state.newPass ==='') || (this.state.newPass2 ==='') }
          />
        </form>
      </div> 
    );
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);
