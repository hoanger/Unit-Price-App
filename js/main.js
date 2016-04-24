var UnitPriceApp = React.createClass ({
  componentWillMount: function() {
    var fireBaseURL = new Firebase('https://unitprice.firebaseio.com/');
    var isLoggedIn = fireBaseURL.getAuth();
    this.setState({ isLoggedIn: isLoggedIn })
  },
  render: function() {
    var isLoggedIn = this.state.isLoggedIn;
    if (isLoggedIn) {
      console.log("User " + isLoggedIn.uid + " is logged in with " + isLoggedIn.provider);
      return (
        <MainMenu />
      );
    } else {
      console.log("User is logged out");
      return (
        <LoginBox />
      );
    };
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
    return { userName: '', password: '' };
  },
  handleUserChange: function(e) {
    this.setState({ userName: e.target.value });
  },
  handlePassChange: function(e) {
    this.setState({ password: e.target.value });
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var userN = this.state.userName.trim();
    var pass = this.state.password;
    if (userN === "user" && pass === "pass") {
        ReactDOM.unmountComponentAtNode(document.getElementById('content')); // Unmount loginbox
        ReactDOM.render(  // Load MainMenu
          <MainMenu />,
          document.getElementById('content')
        );
    } else {
        this.setState({userName: '', password: ''});  // Clear state
        alert("Error: Incorrect Password or Username");  // Error message
    }
  },
  render: function() {
    return (
      <form className="loginForm" onSubmit={this.handleSubmit} >
        <p>
          <input
            type="text"
            id="userName"
            placeholder="User Name"
            value={this.state.userName}
            onChange={this.handleUserChange}
            required autofocus
            />
        </p>
        <p>
          <input
            type="password"
            id="pswrd"
            placeholder="Password"
            value={this.state.password}
            onChange={this.handlePassChange}
            required/>
        </p>
          <input
            type="submit"
            id="loginBtn"
            value="Login"/>
      </form>
        
    );
  }
});

var MainMenu = React.createClass({
  render: function() {
    return (
        <div className="MainMenu">
            <h1>Main Menu</h1>
        </div>
    );
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);




/* function to check userid & password
function check() {
    var form = $('#login')[0];
    console.log(form.userName.value);
    console.log(form.pswrd.value);
/* the following code checks whether the entered userid and password are matching
    if (form.userName.value === "user" && form.pswrd.value === "pass") {
        window.location.href = "app.html";/* opens the target page while Id & password matches
    } else {
        alert("Error Password or Username");/* displays error message
    }
}

$("#userName").keyup(function(event){
    if(event.keyCode == 13){
        $("#pswrd").focus();
    }
});

$("#pswrd").keyup(function(event){
    if(event.keyCode == 13){
        $("#loginBtn").click();
    }
});
*/