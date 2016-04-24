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
        <div class="loginBox">
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
    // TODO: logout if logged in
    // TODO: Load create user component
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

var MainMenu = React.createClass({
  render: function() {
    console.log(this.props.loggedInID);
    return (
        <div class="mainMenu">
          <h1>Main Menu</h1>
        </div>
    );
  }
});

var CreateAcct = React.createClass({
  // TODO: methods for handleSubmit, handleEmailChange, handlePassChange, handleUserChange
  render: function() {
    <div class="createAcct">
        <h1>Create an Account</h1>
      <form class="createAcctForm" onSubmit={this.handleSubmit} >
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
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);
