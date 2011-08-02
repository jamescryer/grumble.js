set js=%~dp0..\js
set css=%~dp0..\css
set mergedjs=%js%\jquery.grumble.min.js
set mergedcss=%css%\grumble.min.css
set png=../images/bubble-sprite.png

del %mergedjs%
del %mergedcss%

java -jar compiler.jar --js=%js%\Bubble.js --js=%js%\jquery.grumble.js --js_output_file=%mergedjs%
java -jar yuicompressor-2.4.6.jar %css%\grumble.css -o %mergedcss%

optipng.exe %png%