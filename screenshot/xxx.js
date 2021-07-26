// function begin(){
//     window.open('./screenshot.html');
// }

var button = document.querySelector('button#button');

var button1 = document.getElementById('button');
button1.addEventListener('click', function(){
    window.open('./screenshot.html');
});


// button.onclick = ()=>{
//     begin();
//     alert('button clicked');
// };
// begin();