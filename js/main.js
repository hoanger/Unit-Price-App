/*** Global variables and constants ***/

const fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');

/*** React components ***/

/********************************************
* Component
* @description Main app component
*********************************************/

var UnitPriceApp = React.createClass ({
  getDefaultProps: function() {
    return {
      isLoggedIn: null,
      JSXitem: {
        login: (
          <div className="row">
            <div id="appContainer" className="medium-6 medium-centered large-4 large-centered columns" />
          </div>
          ),
        app: <div id="appContainer" />
      }
    }
  },
  componentDidMount: function() {
    //console.log("UnitPriceApp DidMount");
    /* Listen for Firebase authentication state changes and pass data through callback */
    fireBaseURL.onAuth(this.setAuth);
  },
  componentDidUpdate: function() {
    //console.log("UnitPriceApp DidUpdate");
    var authState = this.props.isLoggedIn;
    /* Record login time and log into main page if authenticated, show login screen otherwise */
    if (authState) {
      let userRef = fireBaseURL.child('users');
      userRef.child(authState.uid).update({lastLoggedIn: Firebase.ServerValue.TIMESTAMP});
      ReactDOM.render(
        <MainMenu userAuth={authState} />,
        document.getElementById('appContainer')
      );
    } else {
      ReactDOM.render(
        <LoginBox />,
        document.getElementById('appContainer')
      );
    }
  },
  /**
  * @description Callback to update props with
  * @param authData {object} authData - Firebase user authentication info
  */
  setAuth: function(authData) {
    ReactDOM.unmountComponentAtNode(document.getElementById('appContainer'));
    ReactDOM.render(
      <UnitPriceApp isLoggedIn={authData} />,
      document.getElementById('content')
    );
    if (authData) {
      console.log("User " + authData.uid + " is logged in with " + authData.provider);
    } else {
      console.log("User is logged out");
    }
  },
  render: function() {
    var JSXitem;
    if (this.props.isLoggedIn){
      JSXitem = this.props.JSXitem.app;
    } else {
      JSXitem = this.props.JSXitem.login;
    }
    return JSXitem;
  }
});

/********************************************
* Component
* @description Container for authentication items when not logged in
*********************************************/

var LoginBox = React.createClass({
  getInitialState: function() {
    return {newAcct: false}
  },
  /**
  * @description Set state to render create account form
  * @param {object} e - onClick event object
  */
  handleCreateAcct: function(e) {
    e.preventDefault();
    this.setState({newAcct: true});
  },
  /**
  * @description Set state to render login form
  * @param {object} e - onClick event object
  */
  backToLogin: function(e) {
    e.preventDefault();
    this.setState({newAcct: false});
  },
  render: function() {
    var JSXitem;
    if (this.state.newAcct) {
      JSXitem = (
        <div>
          <CreateAcct />
          <p className="text-center nav-a"><a onClick={this.backToLogin}>Cancel</a></p>
        </div>
      )
    } else {
      JSXitem = (
        <div>
          <LoginForm />
          <div id="createBtnContainer">
            <p><a onClick={this.handleCreateAcct}  type="button" id="createAcctBtn" className="button expanded">Create a New Account</a></p>
          </div>
        </div>
      )
    }
    return JSXitem;
  }
});

/**
* Component
* @description Login form component
*/
var LoginForm = React.createClass({
  getInitialState: function() {
    return {loginName: '', password: ''};
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handleLoginChange: function(e) {
    this.setState({loginName: e.target.value});
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handlePassChange: function(e) {
    this.setState({password: e.target.value});
  },
  /**
  * @description Attempt to authenticate with email and password
  * @param {object} e - onClick event object
  */
  handleSubmit: function(e) {
    e.preventDefault();
    var self = this;
    var userN = this.state.loginName.trim();
    var pass = this.state.password;
    fireBaseURL.authWithPassword({
      email: userN,
      password: pass
    }, function(error, authData){
      if (!error) {
        console.log("Authenticated successfully with payload:", authData);
        /* Load app when authenticated */
        ReactDOM.render(
          <MainMenu userAuth={ authData }/>,
          document.getElementById('appContainer')
        );
      } else {
          self.setState({loginName: '', password: ''});
          console.log("Login Failed!", error);
      }
    })
  },
  render: function() {
    return (
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
    );
  }
});

/********************************************
* Component
* @description Create new account component
*********************************************/

var CreateAcct = React.createClass({
  getInitialState: function() {
    return {
      email: '',
      password: '',
      password2: '',
      username: ''
    };
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handleEmailChange: function(e) {
    this.setState({email: e.target.value});
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handlePassChange: function(e) {
    this.setState({password: e.target.value});
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handlePassChange2: function(e) {
    this.setState({password2: e.target.value});
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handleUserChange: function(e) {
    this.setState({username: e.target.value});
  },
  /**
  * @description Attempt to create user with current state
  * @param {object} e - onClick event object
  */
  handleSubmit: function(e) {
    e.preventDefault();
    var self = this;
    var usersTable = fireBaseURL.child('users');
    var message;
    console.log("Attempting to create user account for ", this.state.email);
    /* Check if username is taken */
    if (this.checkUsernameExists(this.state.username, usersTable)) {
      message = 'Sorry, username: ' + this.state.username + 'is taken';
      console.log(message);
    /* Check if passwords Match */
    } else if (this.state.password != this.state.password2) {
      message = 'Passwords do not match';
      console.log(message);
    /* create user and authenticate in Firebase */
    } else {
      fireBaseURL.createUser({
        email    : this.state.email,
        password : this.state.password
      }, function(error, userData) {
        if (error) {
          // TODO: handle create errors
          message = error;
          console.log(message);
        } else {
          fireBaseURL.authWithPassword({
            email    : self.state.email,
            password : self.state.password
          }, function() {
            // TODO: handle auth errors
            return;
          });
          /* record user info to user table */
          self.createUser(userData);
          self.setState({
            email: '',
            password: '',
            password2: '',
            username: ''
          });
          message = "Successfully created user account with uid: " + userData.uid;
          console.log(message);
          console.log(userData);
        }
      });
    }
  },
  /**
  * @description Create entry in user table
  * @param {object} userData - contains Firebase user ID and email address
  * @returns {boolean}
  */
  // TODO: Refactor Firebase createUser into this function instead
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
  /**
  * @description Check user table if user name is taken
  * @param {string} username - user name
  * @param {Firebase} usersTable - Firebase ref for the user table
  * @returns {boolean} - true if match is found, false if otherwise
  */
  // TODO: refactor this to be reusable to check for anything with a child path
  checkUsernameExists: function (username, usersTable) {
    usersTable.orderByChild("username").equalTo(username).once("value", function(snapshot) {
      return (snapshot.val() !== null);
    });
  },
  render: function() {
    return (
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
    )
  }
});

/********************************************
* Component
* @description Main app page component for logged in users
*********************************************/

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
    ReactDOM.render(
      <ChangePass userAuth={this.props.userAuth} />,
      document.getElementById('page-holder')
    );
  },
  render: function() {
    return (
      <div>
        <div className="off-canvas-wrapper">
          <div className="off-canvas-wrapper-inner" data-off-canvas-wrapper>

            {/*<!-- off-canvas title bar for 'small' screen -->*/}
            <div className="title-bar" data-responsive-toggle="widemenu" data-hide-for="medium">
              <div className="title-bar-left">
                <button className="menu-icon" type="button" data-open="offCanvasLeft"></button>
                <span className="title-bar-title">Foundation</span>
              </div>
              <div className="title-bar-right">
                <span className="title-bar-title">Login</span>
                <button className="menu-icon" type="button" data-open="offCanvasRight"></button>
              </div>
            </div>

            {/*<!-- off-canvas left menu -->*/}
            <div className="off-canvas position-left" id="offCanvasLeft" data-off-canvas>
              <ul className="vertical dropdown menu" data-dropdown-menu>
                <li><a href="left_item_1">Left item 1</a></li>
                <li><a href="left_item_2">Left item 2</a></li>
                <li><a href="left_item_3">Left item 3</a></li>
              </ul>
            </div>

            {/*<!-- off-canvas right menu -->*/}
            <div className="off-canvas position-right" id="offCanvasRight" data-off-canvas data-position="right">
              <ul className="vertical dropdown menu" data-dropdown-menu>
                <li><a href="right_item_1">Right item 1</a></li>
                <li><a href="right_item_2">Right item 2</a></li>
                <li><a href="right_item_3">Right item 3</a></li>
              </ul>
            </div>

            {/*<!-- "wider" top-bar menu for 'medium' and up -->*/}
            <div id="widemenu" className="top-bar">
              <div className="top-bar-left">
                <ul className="dropdown menu" data-dropdown-menu>
                  <li className="menu-text">Foundation</li>
                  <li className="has-submenu">
                    <a href="#">Item 1</a>
                    <ul className="menu submenu vertical" data-submenu>
                      <li><a href="left_wide_11">Left wide 1</a></li>
                      <li><a href="left_wide_12">Left wide 2</a></li>
                      <li><a href="left_wide_13">Left wide 3</a></li>
                    </ul>
                  </li>
                  <li className="has-submenu">
                    <a href="#">Item 2</a>
                    <ul className="menu submenu vertical" data-submenu>
                      <li><a href="left_wide_21">Left wide 1</a></li>
                      <li><a href="left_wide_22">Left wide 2</a></li>
                      <li><a href="left_wide_23">Left wide 3</a></li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div className="top-bar-right">
                <ul className="menu">
                  <li><input type="search" placeholder="Search" /></li>
                  <li><button className="button">Search</button></li>
                </ul>
              </div>
            </div>

            {/*<!-- original content goes in this container -->*/}
            <div className="off-canvas-content" data-off-canvas-content>
              Some stuff
            </div>

          {/*<!-- close wrapper, no more content after this -->*/}
          </div>
        </div>

        <div className="mainMenu row">
          <div className="medium-6 medium-centered large-4 large-centered columns">
            <h2>Main Menu</h2>
            <ul>
              <li><a href='' onClick={this.changePass}>Change my password</a></li>
              <li><a href='' onClick={this.logoutCurrentUser}>Logout {this.props.userAuth.uid}</a></li>
            </ul>
            <hr />
            <div id="page-holder" />
          </div>
        </div>
       </div>
    );
  }
});

/********************************************
* Component
* @description Change password form component
*********************************************/

var ChangePass = React.createClass({
  getInitialState: function() {
    return { oldPass: '', newPass: '', newPass2: '' };
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handleOldPass: function(e) {
    this.setState({ oldPass: e.target.value });
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handlePassChange: function(e) {
    this.setState({ newPass: e.target.value });
  },
  /**
  * @description Synchronize form field with state
  * @param {object} e - onChange event object
  */
  handlePass2Change: function(e) {
    this.setState({ newPass2: e.target.value });
  },/**
  * @description Attempt to change/update password
  * @param {object} e - onClick event object
  */
  handleSubmit: function(e) {
    e.preventDefault();
    var self = this;
    var message;
    var emailRef = fireBaseURL.child('users').child(this.props.userAuth.uid).child('email');
    console.log(emailRef);
    emailRef.once("value", function(snapshot) {
      console.log(snapshot);
      if (self.state.newPass != self.state.newPass2) {
        message = "New Passwords do not match!";
        console.log(message);
      } else {
        fireBaseURL.changePassword({
          email       : snapshot.val(),
          oldPassword : self.state.oldPass,
          newPassword : self.state.newPass
        }, function(error) {
          if (error) {
            message = "Error changing password.";
            console.log(message);
            console.log(error);
          } else {
            message = "Password changed successfully";
            console.log(message);
          }
        });
      }
    self.setState({ oldPass: '', newPass: '', newPass2: '' });
    });
  },
  render: function() {
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
