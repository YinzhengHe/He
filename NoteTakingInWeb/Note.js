/**
 * Created by hyz14 on 2021/7/27.
 */
/* get Element*/
const element = document.querySelectorAll('.btn');


element.forEach(function(element){
    element.addEventListener('click',function () {
       var command = element.dataset['element'];
       console.log('command is :'+ command);
       if (command=="insertImage"){
           var uploadImage = document.getElementById('uploadImage');
           uploadImage.click();
           
           var imageReader = new FileReader();

           /*获取到本机图片的URL*/
           uploadImage.addEventListener('change',function () {
               var chooseImage = this.files[0];
               console.log(chooseImage);

               var content = document.getElementById('content');
               imageReader.onload = function (e) {
                   content.src = e.target.result;
                   url = e.target.result;
                   content.focus();
                   document.execCommand('insertHTML',false,'<img src= "'+url+'" style="float: left" height="100" width="100">');
               };
               imageReader.abort();
               imageReader.readAsDataURL(chooseImage)
           });

       }else if (command=="download"){
           // const a = document.createElement("a");
           // const blob = new Blob([content.innerText,content.innerHTML]);
           // const dataURL = URL.createObjectURL(blob);
           // a.href = dataURL;
           // a.download = "file"+".doc";
           // a.click();
          // ${"#content"}.wordExport("file");

           /*下载的 word 支持图片*/
           var content = document.getElementById('content');
           /*wordExport是jquery特有的方法，要将dom对象转换成jquery对象才行*/
           $(content).wordExport("good")


       }else{
           document.execCommand(command,false,null)
       }
    });
});

