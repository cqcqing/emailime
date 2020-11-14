# Email IME

Email IME is a JavaScript library for enter multiple email addresses. It's javaScript based.
It works in all modern desktop browsers and doesn't depend on any external libraries.

![Example](http://www.cqcqing.com/ime-pc/myPlugin20201109225829.png)

## Demo
[Demo](http://www.cqcqing.com/ime-pc) works in desktop browsers.

## Installation
You can install the latest release using npm:
```bash
npm install --save emailime
```

You can also add it directly to your page using `<link>` and `<script>` tag:
```html
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/emailime/emailIME.css"/>
<script src="https://cdn.jsdelivr.net/npm/emailime/emailIME.min.js"></script>
```

This library is provided as UMD (Universal Module Definition).

## Usage
If you install the release using npm, please require 'emailime' in the file where you need or In your entry js, main.js mostly.
``` javascript
const emailIME = require('emailime')
```
### API
``` javascript
var baseNode = document.querySelector("div");

var example = new emailIME(baseNode, '收件人', ['123456@cc.com']);

// add email addresses from Array
var list = ['123@cc.com','456@cc.com','789@cc.com']
example.addAddrs(list)

// get email addresses as Array
example.getAddrs()

// remove the emailIME
example.destroy()
```

## License
Released under the [MIT License](http://www.opensource.org/licenses/MIT).
