/*function to check userid & password*/
function check() {
    var form = $('#login')[0];
    console.log(form.userName.value);
    console.log(form.pswrd.value);
/*the following code checkes whether the entered userid and password are matching*/
    if (form.userName.value === "user" && form.pswrd.value === "pass") {
        window.location.href = "app.html";/*opens the target page while Id & password matches*/
    } else {
        alert("Error Password or Username");/*displays error message*/
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