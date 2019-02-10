var usr1 = document.getElementsByClassName('curruser');
var usr2 = document.getElementsByClassName('msguser');
var x = document.getElementsByClassName("hidden");
var i;
for (i = 0; i < x.length; i++) {
        if (usr1[i].innerHTML == usr2[i].innerHTML)
                x[i].style.display = 'block';
}