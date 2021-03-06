/*** Global variables and constants ***/

var config = {
    apiKey: "AIzaSyAABdXJjCOZwuCdbztVs3CIXIdhlrvucj4",
    authDomain: "unitprice.firebaseapp.com",
    databaseURL: "https://unitprice.firebaseio.com"
  };
/* Initialize Firebase */
firebase.initializeApp(config);
const dataBase = firebase.database();
const fireBaseURL = dataBase.ref();
const auth = firebase.auth();
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
            <div id="appContainer" className="col-sm-6 col-md-4 col-sm-offset-3 col-md-offset-4" />
          </div>
          ),
        app: <div><div id="appContainer" /><div id="page-holder" /></div>
      }
    }
  },
  componentDidMount: function() {
    /* Listen for Firebase authentication state changes and pass data through callback */
    auth.onAuthStateChanged(this.setAuth);
  },
  componentDidUpdate: function() {
    var authState = this.props.isLoggedIn;
    /* Record login time and log into main page if authenticated, show login screen otherwise */
    if (authState) {
      var userRef = fireBaseURL.child('users');
      userRef.child(authState.uid).update({lastLoggedIn: firebase.database.ServerValue.TIMESTAMP});
      ReactDOM.render(
        <div className="row"><h1>Welcome</h1></div>,
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
  * @param user {object} user - Firebase user authentication info
  */
  setAuth: function(user) {
    var userObj = null;
    if (user) {
      userObj = {
        uid: user.uid,
        provider: user.providerId
      };
    }
    ReactDOM.unmountComponentAtNode(document.getElementById('appContainer'));
    ReactDOM.render(
      <UnitPriceApp isLoggedIn={userObj} />,
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
          <div className="free-btn-container">
            <a onClick={this.backToLogin} className="btn btn-default btn-block free-btn">Cancel</a>
          </div>
        </div>
      )
    } else {
      JSXitem = (
        <div id="login-box">
          <LoginForm />
          <div className="free-btn-container">
            <a onClick={this.handleCreateAcct}  type="button" className="btn btn-default btn-block free-btn">Create a New Account</a>
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
  handleLoginChange: function(e) {
    this.setState({loginName: e.target.value});
  },
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

    auth.signInWithEmailAndPassword(userN, pass).then(function(result){
      console.log("User authenticated:", result.uid);
    }).catch(function(error){
      self.setState({loginName: '', password: ''});
      console.log("Login Failed!", error.message);
    });
  },
  render: function() {
    return (
      <form>
        <div className="user-form">
          <h4 className="text-center">Log in to UnitPrice</h4>
          <div className="form-group">
            <label for="loginName">Email</label>
            <input
              type="email"
              className="form-control"
              id="loginName"
              autoFocus
              placeholder="email@someplace.com"
              value={this.state.loginName}
              onChange={this.handleLoginChange}
            />
          </div>
          <div className="form-group">
            <label for="pswrd">Password</label>
            <input
              type="password"
              className="form-control"
              id="pswrd"
              placeholder="Shhh! It's a secret"
              value={this.state.password}
              onChange={this.handlePassChange}
            />
          </div>
          <a onClick={this.handleSubmit} type="submit" className="btn btn-primary btn-block">Log In</a>
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
  handleEmailChange: function(e) {
    this.setState({email: e.target.value});
  },
  handlePassChange: function(e) {
    this.setState({password: e.target.value});
  },
  handlePassChange2: function(e) {
    this.setState({password2: e.target.value});
  },
  handleUserChange: function(e) {
    this.setState({username: e.target.value});
  },
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
      auth.createUserWithEmailAndPassword(self.state.email, self.state.password).then(function(result){
        self.createUser(result);
        self.setState({
          email: '',
          password: '',
          password2: '',
          username: ''
        });
      }).catch(function(error) {
        console.log(error.code);
        console.log(error.message);
      });
      /* record user info to user table */

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
        email: userData.email,
        date_created: firebase.database.ServerValue.TIMESTAMP
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
          <div className="form-group">
            <label for="username">Choose a Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              autoFocus
              placeholder="Kickass code name"
              value={this.state.username}
              onChange={this.handleUserChange}
            />
           </div>
           <div className="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="email@someplace.com"
              value={this.state.email}
              onChange={this.handleEmailChange}
            />
          </div>
          <div className="form-group">
            <label for="pswrd">Password</label>
            <input
              type="password"
              className="form-control"
              id="pswrd"
              placeholder="Make it hard to guess"
              value={this.state.password}
              onChange={this.handlePassChange}
            />
          </div>
          <div className="form-group">
            <label for="pswrd2">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="pswrd2"
              placeholder="but you still need to remember it"
              value={this.state.password2}
              onChange={this.handlePassChange2}
            />
          </div>
          <a onClick={this.handleSubmit} type="submit" className="btn btn-primary btn-block">Create Account and Login</a>
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
  componentWillMount: function() {
    ReactDOM.render(<Compare userAuth={this.props.userAuth} />, document.getElementById('page-holder'));
  },
  toCompare: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'compare'});
    ReactDOM.render(<Compare userAuth={this.props.userAuth} />, document.getElementById('page-holder'));
  },
  toPriceApp: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'priceItem'});
    ReactDOM.render(<PriceApp userAuth={this.props.userAuth} />, document.getElementById('page-holder'));
  },
  toUserPrefs: function(e) {
    e.preventDefault();
    this.setState({appComponent: 'account'});
    ReactDOM.render(<UserPrefs userAuth={this.props.userAuth} />, document.getElementById('page-holder'));
  },
  render: function() {
    return (
      <div>
        <div className="mainMenu">
          <div className="menu-centered row">
            <ul className="nav nav-pills">
              <li role="navigation"><a href="" onClick={this.toCompare}><span>Compare</span></a></li>
              <li role="navigation"><a href="" onClick={this.toPriceApp}><span>Price it!</span></a></li>
              <li role="navigation"><a href="" onClick={this.toUserPrefs}><span>Account</span></a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

/* Methods used in both Compare and PriceApp components */
var PricePageMixin = {
  componentWillMount: function() {
    var unitRef = fireBaseURL.child('units');
    var itemsRef = unitRef.child("items");
    var weightRef = unitRef.child("weight");
    var volumeRef = unitRef.child("volume")

    this.bindAsArray(itemsRef, 'items');
    this.bindAsArray(weightRef, 'weight');
    this.bindAsArray(volumeRef, 'volume');
  },
  /**
  * @description Set array of units from database based on type and save to state
  * @param {string} unitType - unit category
  */
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
  /**
  * @description Return the item at the '.key' key of an object
  * @param {object} item - an object
  * @returns {string} the value of the object at '.key'
  */
  getKey: function(item) {
    return item['.key'];
  },
  /**
  * @description Check if an item has enough info to do comparison/unit price calc
  * @param {object} item - a React component object
  * @returns {boolean} true if invalid amount or unit is selected, false otherwise
  */
  checkInvalidItem: function(item) {
    var isInvalid = false;
    if (item.state.itemAmount === '0') {
      console.log('Please select an amount for Item ' + item.props.num);
      isInvalid = true;
    }
    if (!item.state.itemUnit) {
      console.log('Please select a unit for Item ' + item.props.num + '.');
      isInvalid = true;
    }
    return isInvalid;
  },
  /**
  * @description Get unit conversion map of specific unit
  * @param {string} unitType - name of the unit type reference in database
  * @param {string} baseUnit - name of the base unit reference in database
  * @returns {object} object with multipliers for each unit conversion from baseunit
  */
  getConversionMap: function(unitType, baseUnit) {
    var conversionMap;
    var unitRef = fireBaseURL.child('units');
    if (baseUnit === '') {
      console.log('One or more items does not have a unit selected.');
      return false;
    } else {
      unitRef.child(unitType).child(baseUnit).once('value', function(data) {
        conversionMap = data.val();
        conversionMap[baseUnit] = 1;
      });
      return conversionMap;
    }
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
  }
};

/********************************************
* Component
* @description Quick Compare page
*********************************************/
var Compare = React.createClass({
  mixins: [ReactFireMixin, PricePageMixin],
  getInitialState: function() {
    return {
      itemsList: ['one','two'],
      compItems: [],
      comparing: false,
      units: null,
      unitGrouping: []
    };
  },
  /**
  * @description Calculate price per unit of all CompItems and sort by ascending unit price
  */
  compareItems: function() {
    var self = this;
    var compItems = [];
    var firstItemRef = this.state.itemsList[0];
    var baseUnit = this.refs[firstItemRef].state.itemUnit;
    var conversionMap;
    var itemsOk = true;
    if (!this.checkInvalidItem(this.refs[firstItemRef])) {
      conversionMap = this.getConversionMap(this.state.units, baseUnit);
      this.state.itemsList.map(function(item, i){
        var price = self.refs[item].state.itemPrice;
        var amount = self.refs[item].state.itemAmount;
        var unit = self.refs[item].state.itemUnit;
        var unroundedPPU = (price / amount) * conversionMap[self.refs[item].state.itemUnit];
        var ppu = Math.round(unroundedPPU*10000)/10000
        var name = self.refs[item].state.itemName;
        var compItem = {
          item: item,
          name: name,
          price: price,
          amount: amount,
          unit: unit,
          ppu: ppu
        }
        if (self.checkInvalidItem(self.refs[item])) {
          itemsOk = false;
        }
        compItems.push(compItem);
      });
      compItems.sort(function(a,b){
        return a.ppu - b.ppu;
      });
      this.setState({
        baseUnit: baseUnit,
        comparing: itemsOk,
        compItems: compItems
      });
    }
  },
  /**
  * @description Form DOM for item comparison
  * @returns {JSX object} Dynamic DOM elements for the component
  */
  getComparison: function() {
    var self = this;
    return this.state.compItems.map(function(item, i) {
      if (item) {
        return (
          <div className="panel panel-info" key={item.item}>
            <div className="panel-heading">
              <h4 className="panel-title">Item {item.item}</h4>
            </div>
            <ul className="list-group">
              {item.name ? <li className="list-group-item">Name: {item.name}</li> : null}
              <li className="list-group-item"><h4><strong>${item.ppu}</strong> per {self.state.baseUnit}</h4></li>
              <li className="list-group-item">${item.price} for {item.amount} {item.unit}</li>
            </ul>
          </div>
        );
      }
    });
  },
  resetCompare: function() {
    this.setState(this.getInitialState());
  },
  render: function() {
    var self = this;
    return (
      <div>
        <div className="row" style={this.state.comparing ? null : {display: 'none'}}>
          <div className="col-sm-6">
            <h3>Comparing by {self.state.units ? self.state.units : null}</h3>
            {self.getComparison()}
            <button onClick={this.resetCompare} type="submit" className="btn btn-default btn-block">Reset</button>
          </div>
        </div>
        <div className="row" style={this.state.comparing ? {display: 'none'} : null}>
          <div className="col-xs-12">
            <h3>Compare Items</h3>
            <div className="btn-group btn-group-lg btn-group-justified" role="group" aria-label="unit type">
              <a type="button" onClick={this.weightUnits} className="btn btn-primary">Weight</a>
              <a type="button" onClick={this.volumeUnits} className="btn btn-info">Volume</a>
              <a type="button" onClick={this.numberUnits} className="btn btn-primary">Number</a>
            </div>
            <div>
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
              </div>
              <div className="col-xs-12 col-md-8 col-md-offset-2" style={this.state.units ? null : {display: 'none'}}>
                <a onClick={this.compareItems} type="submit" className="btn btn-block btn-primary">Compare!</a>
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
* @description Main pricing page
*********************************************/
var PriceApp = React.createClass({
  mixins: [ReactFireMixin, PricePageMixin],
  getInitialState: function () {
    return {
      units: null,
      unitGrouping: []
    };
  },
  render: function() {
    //TODO: chnge unit selector to inline radio buttons
    var self = this;
    return (
      <div className="col-xs-12 align-center">
        <div className="row">
          <h3>Record a price</h3>
          <div className="btn-group btn-group-lg btn-group-justified" role="group" aria-label="unit type">
            <a type="button" onClick={this.weightUnits} className="btn btn-primary">Weight</a>
            <a type="button" onClick={this.volumeUnits} className="btn btn-info">Volume</a>
            <a type="button" onClick={this.numberUnits} className="btn btn-primary">Number</a>
          </div>
          <PriceItem
            units={self.state.units ? self.state.units : "blah"}
            unitgrouping={self.state.unitGrouping}
          />
        </div>
      </div>
    )
  }
});


/* Methods used in both CompItem and PriceItem components */
var PricedItemMixin = {
  getInitialState: function() {
    return {
      itemName: '',
      itemPrice: '0.00',
      itemAmount: '1',
      itemUnit: ''
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (!nextProps.compare && this.props.compare) {
      this.setState(this.getInitialState);
    }
  },
  clearPrice: function(e) {
    if (e.target.value === '0.00') {
      this.setState({itemPrice: ''});
    }
  },
  clearAmount: function(e) {
    if (e.target.value === '1') {
      this.setState({itemAmount: ''});
    }
  },
  restorePriceDefault: function(e) {
    if (e.target.value === '') {
      this.setState({itemPrice: '0.00'});
    }
  },
  restoreAmountDefault: function(e) {
    if (e.target.value === '') {
      this.setState({itemAmount: '1'});
    }
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
  }
};


/********************************************
* Component
* @description Quick Compare item
*********************************************/
var CompItem = React.createClass({
  mixins: [ReactFireMixin, PricedItemMixin],
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
        <div className="col-xs-5 form-group">
          <label for="itemUnit">Unit</label>
            <select
              className="form-control"
              id="itemUnit"
              onChange={self.handleUnitChange}
              value={self.state.itemUnit}
              aria-describedby="helpAmount"
            >
              <option disabled selected> - </option>
              {self.props.unitgrouping.map(createUnits)}
            </select>
            <span id="helpAmount" class="help-block"><h6>{helpText()}</h6></span>
        </div>
      )
    };

    return (
      <form className="col-sm-6">
        <div>
          <div className="user-form compare-form row">
            <h4>Item {this.props.num}</h4>
            <div className="row">
              <div className="col-xs-12">
                <div className="col-xs-4 form-group">
                <label for itemPrice>Price ($)</label>
                  <input
                    className="form-control"
                    type="number"
                    id="itemPrice"
                    placeholder="Price"
                    min="0.00"
                    value={this.state.itemPrice}
                    onFocus={this.clearPrice}
                    onBlur={this.restorePriceDefault}
                    onChange={this.handlePriceChange}
                  />
                </div>
                <div className="col-xs-3 form-group">
                  <label for="itemAmount">Amount</label>
                  <input
                    className="form-control"
                    type="number"
                    id="itemAmount"
                    min="1"
                    value={this.state.itemAmount}
                    onFocus={this.clearAmount}
                    onBlur={this.restoreAmountDefault}
                    onChange={this.handleAmountChange}
                  />
                </div>
                {createUnitSelect()}
              </div>
            </div>
            <div className="col-xs-12 form-group">
              <label for="itemName">Item name</label>
              <input
                className="form-control"
                type="text"
                id="itemName"
                placeholder="Optional"
                value={this.state.itemName}
                onChange={this.handleNameChange}
              />
            </div>
          </div>
        </div>
      </form>
    )
  }
});

/********************************************
* Component
* @description Pricing item
*********************************************/
var PriceItem = React.createClass({
  mixins: [ReactFireMixin, PricedItemMixin],
  getInitialState: function() {
    return {
      units: null,
      unitGrouping: []
    }
  },
  render: function() {
    //TODO: Build PriceItem component
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
        <div className="col-xs-5 form-group">
          <label for="itemUnit">Unit</label>
            <select
              className="form-control"
              id="itemUnit"
              onChange={self.handleUnitChange}
              value={self.state.itemUnit}
              aria-describedby="helpAmount"
            >
              <option disabled selected> - </option>
              {self.props.unitgrouping.map(createUnits)}
            </select>
            <span id="helpAmount" class="help-block"><h6>{helpText()}</h6></span>
        </div>
      )
    };

    return (
      <form className="col-sm-6">
        <div>
          <div className="user-form compare-form row">
            <div className="row">
              <div className="col-xs-12 form-group">
                <label for="itemDescription">Name/Description</label>
                <input
                  className="form-control"
                  type="text"
                  id="itemDescription"
                  placeholder="Brand name, description, etc."
                  value={this.state.itemName}
                  onChange={this.handleNameChange}
                />
              </div>
              <div className="col-xs-12">
              <div className="row">
                <div className="col-xs-4 form-group">
                <label for itemPrice>Price ($)</label>
                  <input
                    className="form-control"
                    type="number"
                    id="itemPrice"
                    placeholder="Price"
                    min="0.00"
                    value={this.state.itemPrice}
                    onFocus={this.clearPrice}
                    onBlur={this.restorePriceDefault}
                    onChange={this.handlePriceChange}
                  />
                </div>
                <div className="col-xs-3 form-group">
                  <label for="itemAmount">Amount</label>
                  <input
                    className="form-control"
                    type="number"
                    id="itemAmount"
                    min="1"
                    value={this.state.itemAmount}
                    onFocus={this.clearAmount}
                    onBlur={this.restoreAmountDefault}
                    onChange={this.handleAmountChange}
                  />
                </div>
                {createUnitSelect()}
              </div>
            </div>
            </div>
          </div>
        </div>
      </form>
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
      <div className="col-xs-12">
        <div className="row">
          <h3>My Account</h3>
          <div className="row">
            <ChangePass userAuth={this.props.userAuth} />
            <Logout userAuth={this.props.userAuth} />
            <div className="user-item col-sm-6 col-md-4" />
          </div>
        </div>
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
        lastLoggedOut: firebase.database.ServerValue.TIMESTAMP
      });
    auth.signOut();
  },
  render: function() {
    return (
      <div id="logout-container" className="user-item col-sm-6 col-md-4">
        <form>
          <div className="user-form">
            <h4 className="text-center">Logout this user</h4>
            <a href='' onClick={this.logoutCurrentUser} className="btn btn-primary btn-block">Logout</a>
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
    return { newPass: '', newPass2: '' };
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
    emailRef.once("value", function(snapshot) {
      if (self.state.newPass != self.state.newPass2) {
        message = "New Passwords do not match!";
        console.log(message);
      } else {
        auth.currentUser.updatePassword(self.state.newPass2).then(function(){
          message = "Password changed successfully";
          ReactDOM.render(
          <Compare userAuth={self.props.userAuth} />,
            document.getElementById('page-holder')
          );
          console.log(message);
        }, function(error){
          if (error.code == 'auth/requires-recent-login') {
            message = "Not recently authenticated. Please log out and log back in and try again.";
            console.log(message);
          } else {
            message = "Error changing password.";
            console.log(message);
            console.log(error.code);
            console.log(error.message);
          }
        });
      }
    self.setState({ oldPass: '', newPass: '', newPass2: '' });
    });
  },
  render: function() {
    return (
      <div id="change-pass-container" className="user-item col-sm-6 col-md-4">
        <form>
          <div className="user-form">
            <h4 className="text-center">Change your password</h4>
            <div className="form-group">
              <label>New Password</label>
              <input
                className="form-control"
                type="password"
                id="newPswrd"
                placeholder="Enter your new password"
                value={this.state.newPass}
                onChange={this.handlePassChange}
              />
            </div>
            <div className="form-group">
              <input
                className="form-control"
                type="password"
                id="oldPswrd"
                placeholder="Confirm new password"
                value={this.state.newPass2}
                onChange={this.handlePass2Change}
              />
            </div>
            <div className="form-group">
              <button onClick={this.handleSubmit} type="submit" className="btn btn-primary btn-block">Change Password</button>
            </div>
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