var UnitPriceApp = React.createClass ({
  getInitialState: function() {
    return { isLoggedIn: '' };
  },
  componentWillMount: function() {
    var fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');
    var isLoggedIn = fireBaseURL.getAuth();
    this.setAuth(isLoggedIn);
    fireBaseURL.onAuth(this.setAuth);
  },
  setAuth: function(authData) {
    if (authState) {
      var authState;
      this.setState({ isLoggedIn: authData });
      authState = this.state.isLoggedIn;
      console.log("User " + authState.uid + " is logged in with " + authState.provider);
    } else {
      console.log("User is logged out");
    }
  },
  render: function() {
    var authState = this.state.isLoggedIn;
    if (authState) {
      return <MainMenu LoggedInID={ authState.uid } />;
    } else {
      return <LoginBox />;
    }
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
    e.preventDefault();
    var userN = this.state.loginName.trim();
    var pass = this.state.password;
    if (userN === "user" && pass === "pass") {
        ReactDOM.unmountComponentAtNode(document.getElementById('content')); // Unmount loginbox
        ReactDOM.render(  // Load MainMenu
          <MainMenu loggedInID="userid-12345"/>,
          document.getElementById('content')
        );
    } else {
        this.setState({loginName: '', password: ''});  // Clear state
        alert("Error: Incorrect Password or Username");  // Error message
    }
  },
  handleCreateAcct: function(e) {
    e.preventDefault();
    console.log(e.type, ", ", e.target);
    // TODO: Load create user component
    ReactDOM.unmountComponentAtNode(document.getElementById('content')); // Unmount loginbox
    ReactDOM.render(  // Load Create Account page
      <CreateAcct />,
      document.getElementById('content')
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
  // TODO: handleSubmit to create a new entry in the users table and record user info
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
    var fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');
    var usersTable = fireBaseURL.child('users');
    /* Check if username is taken */
    
    if ( this.checkUsernameExists(this.state.username, usersTable) ) {
      var message = 'Sorry, username: ' + this.state.username + 'is taken';
      this.setState({ error: { vis: true, msg: message } });
    /* Check if passwords Match */
    } else if (this.state.password != this.state.password2) {
      this.setState({ error: { vis: true, msg: 'Passwords do not match' } });
    } else {
      fireBaseURL.createUser({
        email    : this.state.email,
        password : this.state.password
      }, function(error, userData) {
        if (error) {
          console.log("Error creating user:", error);
          self.setState({ error: { vis: true, msg: error }, password: '', password2: '' });
        } else {
          self.createUser(userData.uid); // record user info to table
          console.log("Successfully created user account with uid:", userData.uid);
          console.log(userData);
          self.setState({
            email: '',
            password: '',
            password2: '',
            username: '',
            error: {
              vis: false,
              msg: ''
            }
          }); // clear form
          ReactDOM.unmountComponentAtNode(document.getElementById('content')); // Unmount loginbox
          ReactDOM.render(  // Load Login page
            <LoginBox />,
            document.getElementById('content')
          );
        }
      });
    }
  },
  createUser: function(uid) {
      var self = this;
      var fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');
      var usersTable = fireBaseURL.child('users');
      usersTable.child(uid).set({
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
        <form className="createAcctForm" onSubmit={this.handleSubmit} >
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
              value="Create Account"
            />
          </p>
        </form>
      </div>
    )
    
  }
});

var MainMenu = React.createClass({
  // TODO: add logout button and method
  render: function() {
    console.log(this.props.loggedInID);
    return (
        <div className="mainMenu">
          <h1>Main Menu</h1>
        </div>
    );
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);
