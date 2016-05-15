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
        app: <div><div id="appContainer" /><div id="page-holder" /></div>
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
        <div className="row column"><h1>Welcome</h1></div>,
        document.getElementById('page-holder')
      );
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
        <div id="login-box">
          <CreateAcct />
          <p className="text-center nav-a"><a onClick={this.backToLogin}>Cancel</a></p>
        </div>
      )
    } else {
      JSXitem = (
        <div id="login-box">
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
  * @param {Firebase} usersTable - Firebase reference for the user table
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
* @description Main menu page component for logged in users
*********************************************/

var MainMenu = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {appComponent: 'compare'};
  },
  componentDidUpdate: function() {
    var self = this;
    var JSXitem
    switch (self.state.appComponent) {
      case 'compare':
      default:
        JSXitem = <Compare userAuth={self.props.userAuth} />;
        break;
      case 'priceItem':
        JSXitem = <PriceApp userAuth={self.props.userAuth} />
        break;
      case 'account':
        JSXitem = <UserPrefs userAuth={self.props.userAuth} />
        break;
    }
    ReactDOM.render(JSXitem, document.getElementById('page-holder'));
  },
  toCompare: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'compare'});
  },
  toPriceApp: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'priceItem'});
  },
  toUserPrefs: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'account'});
  },
  render: function() {
    return (
      <div>
        <div className="mainMenu row">
          <div className="menu-centered">
            <ul className="menu">
              <li><a href="" onClick={this.toCompare}><i className="fi-pricetag-multiple" /><span>Compare</span></a></li>
              <li><a href="" onClick={this.toPriceApp}><i className="fi-bookmark" /><span>Price it!</span></a></li>
              <li><a href="" onClick={this.toUserPrefs}><i className="fi-torso" /><span>Account</span></a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

/********************************************
* Component
* @description Quick Compare page
*********************************************/
var Compare = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      itemsList: ['one','two'],
      compItems: [],
      comparing: false,
      units: null,
      unitGrouping: []
    };
  },
  componentWillMount: function() {
    var unitRef = fireBaseURL.child('units');
    var itemsRef = unitRef.child("items");
    var weightRef = unitRef.child("weight");
    var volumeRef = unitRef.child("volume")

    this.bindAsArray(itemsRef, 'items');
    this.bindAsArray(weightRef, 'weight');
    this.bindAsArray(volumeRef, 'volume');
  },
  setUnits: function(unitType) {
    var unitArr = [];
    switch (unitType) {
      case 'weight':
      default:
        unitArr = this.state.weight.map(this.getKey);
        break;
      case 'volume':
        unitArr = this.state.volume.map(this.getKey);
        break;
      case 'items':
        unitArr = this.state.items.map(this.getKey);
        break;
    }
    this.setState({unitGrouping: unitArr});
  },
  getKey: function(item, index) {
    return item['.key'];
  },
  compareItems: function() {
    var self = this;
    var compItems = [];
    var firstItemRef = this.state.itemsList[0];
    var baseUnit = this.refs[firstItemRef].state.itemUnit;
    var conversionMap = this.getConversionMap(this.state.units, baseUnit);
    this.state.itemsList.map(function(item, i){
      var price = self.refs[item].state.itemPrice;
      var amount = self.refs[item].state.itemAmount;
      var ppu = (price / amount) * conversionMap[self.refs[item].state.itemUnit];
      var compItem = {
        item: item,
        name: self.refs[item].state.itemName,
        price: self.refs[item].state.itemPrice,
        amount: self.refs[item].state.itemAmount,
        unit: self.refs[item].state.itemUnit,
        ppu: ppu
      }
      compItems.push(compItem);
    });
    compItems.sort(function(a,b){
      return a.ppu - b.ppu;
    });
    this.setState({
      baseUnit: baseUnit,
      comparing: true,
      compItems: compItems
    });
  },
  getConversionMap: function(unitType, baseUnit) {
    var conversionMap;
    var unitRef = fireBaseURL.child('units');
    unitRef.child(unitType).child(baseUnit).once('value', function(data) {
      conversionMap = data.val();
      conversionMap[baseUnit] = 1;
    });
    return conversionMap;
  },
  getComparison: function() {
    var self = this;
    return this.state.compItems.map(function(item, i) {
      if (item) {
        return (
          <div key={item.item}>
            <h5><strong>Item {item.item}</strong></h5>
            <ul>
              {item.name ? <li>Name: {item.name}</li> : null}
              <li>${item.price} for {item.amount} {item.unit}</li>
              <li><strong>Unit price: ${item.ppu}</strong> per {self.state.baseUnit}</li>
            </ul>
          </div>
        );
      }
    });
  },
  resetCompare: function() {
    this.setState(this.getInitialState());
  },
  weightUnits: function() {
    this.setState({units: 'weight'});
    this.setUnits('weight');
  },
  volumeUnits: function() {
    this.setState({units: 'volume'});
    this.setUnits('volume');
  },
  numberUnits: function() {
    this.setState({units: 'items'});
    this.setUnits('items');
  },
  render: function() {
    var self = this;
    return (
      <div>
        <div className="row align-center" style={this.state.comparing ? null : {display: 'none'}}>
          <div className="column">
            <h4>Comparing items by {self.state.units ? self.state.units : null}</h4>
            {self.getComparison()}
            <a onClick={this.resetCompare} type="submit" className="button expanded">Reset</a>
          </div>
        </div>
        <div className="row align-center" style={this.state.comparing ? {display: 'none'} : null}>
          <div className="column">
            <h4>Compare Items</h4>
            <div className="button-group expanded">
              <a onClick={this.weightUnits} className="success button">Weight</a>
              <a onClick={this.volumeUnits} className="button">Volume</a>
              <a onClick={this.numberUnits} className="warning button">Number</a>
            </div>
            <div className="row" style={this.state.units ? null : {display: 'none'}}>
              {this.state.itemsList.map(function(item, i) {
                return (
                  <CompItem
                    key={i}
                    ref={item}
                    num={i+1}
                    units={self.state.units ? self.state.units : "blah"}
                    compare={self.state.comparing}
                    unitgrouping={self.state.unitGrouping}
                  />
                );
              })}
              <div className="columns">
                <a onClick={this.compareItems} type="submit" className="button expanded">Compare!</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
});

/********************************************
* Component
* @description Quick Compare item
*********************************************/
var CompItem = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      itemName: '',
      itemPrice: '0.00',
      itemAmount: '1',
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (!nextProps.compare && this.props.compare) {
      this.setState(this.getInitialState);
    }
    this.setState({
      itemUnit: '',
    })
  },
  clearPrice: function() {
    this.setState({itemPrice: ''});
  },
  clearAmount: function() {
    this.setState({itemAmount: ''});
  },
  handleNameChange: function(e) {
    this.setState({itemName: e.target.value});
  },
  handlePriceChange: function(e) {
    this.setState({itemPrice: e.target.value});
  },
  handleAmountChange: function(e) {
    this.setState({itemAmount: e.target.value});
  },
  handleUnitChange: function(e) {
    this.setState({itemUnit: e.target.value});
  },
  render: function() {
    var self = this;

    var helpText = function() {
      var helpTxt;
      switch (self.props.units) {
        case 'weight':
          helpTxt = "e.g. 250 mL"
          break;
        case 'items':
          helpTxt = "e.g. 2 dozen"
          break;
        case 'volume':
        default:
          helpTxt = "e.g. 355 mL"
      }
      return helpTxt;
    }

    var createUnits = function(item, index) {
      return <option
              key={index}
              value={item}
              onChange={self.handleUnitChange}
            >{item}</option>;
    }

    var createUnitSelect = function() {
      return (
        <div className="small-4 columns">
          <label>{self.props.units}
            <select
              id="itemUnit"
              onChange={self.handleUnitChange}
              value={self.state.itemUnit}
            >
              <option disabled selected> -select- </option>
              {self.props.unitgrouping.map(createUnits)}
            </select>
          </label>
        </div>
      )
    };

    return (
      <div className="medium-6 columns align-center">
        <div>
          <div className="user-form compare-form column">
            <h4>Item {this.props.num}</h4>
            <div className="row">
              <div className="small-5 columns">
              <label>Price
                  <div className="input-group">
                    <span className="input-group-label">$</span>
                    <input
                      className="input-group-field"
                      type="number"
                      id="itemPrice"
                      placeholder="Price"
                      min="0.00"
                      value={this.state.itemPrice}
                      onFocus={this.clearPrice}
                      onChange={this.handlePriceChange}
                    />
                  </div>
                </label>
              </div>
              <div className="small-3 columns">
                <label>Amount
                  <input
                    type="number"
                    aria-describedby="amountHelpText"
                    id="itemAmount"
                    placeholder="Amount"
                    min="0"
                    value={this.state.itemAmount}
                    onFocus={this.clearAmount}
                    onChange={this.handleAmountChange}
                  />
                  <p className="help-text" id="amountHelpText">{helpText()}</p>
                </label>
              </div>
              {createUnitSelect()}
            </div>
            <label>Item name
              <input
                type="text"
                id="itemName"
                placeholder="Optional"
                value={this.state.itemName}
                onChange={this.handleNameChange}
              />
            </label>
          </div>
        </div>
      </div>
    )
  }
});

/********************************************
* Component
* @description Main pricing page
*********************************************/
var PriceApp = React.createClass({
  mixins: [ReactFireMixin],
  render: function() {
    return (
      <div className="row align-center">
        <div className="column">Main app here</div>
      </div>
    )
  }
});

/********************************************
* Component
* @description User preference page
*********************************************/
var UserPrefs = React.createClass({
  render: function() {
    return (
      <div className="row align-center">
        <ChangePass userAuth={this.props.userAuth} />
        <Logout userAuth={this.props.userAuth} />
        <div className="user-item medium-6 large-4 columns" />
      </div>
    )
  }
});

/********************************************
* Component
* @description Logout form (just a button)
*********************************************/
var Logout = React.createClass({
  logoutCurrentUser: function(e, uid) {
    e.preventDefault();
    let userRef = fireBaseURL.child('users');
      userRef.child(this.props.userAuth.uid).update({
        lastLoggedOut: Firebase.ServerValue.TIMESTAMP
      });
    fireBaseURL.unauth();
  },
  render: function() {
    return (
      <div id="logout-container" className="user-item medium-6 large-4 columns">
        <form>
          <div className="user-form">
            <h4 className="text-center">Logout this user</h4>
            <p><a href='' onClick={this.logoutCurrentUser} className="button expanded">Logout</a></p>
          </div>
        </form>
      </div>
    )
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
            ReactDOM.render(
            <PriceApp userAuth={self.props.userAuth} />,
              document.getElementById('page-holder')
            );
            console.log(message);
          }
        });
      }
    self.setState({ oldPass: '', newPass: '', newPass2: '' });
    });
  },
  render: function() {
    return (
      <div id="change-pass-container" className="user-item medium-6 large-4 columns">
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
    );
  }
});

ReactDOM.render(
  <UnitPriceApp />,
  document.getElementById('content')
);
