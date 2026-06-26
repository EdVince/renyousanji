import Main from './js/main.js';

try {
  new Main();
} catch (e) {
  document.body.innerHTML = '<pre style="color:red;padding:20px;white-space:pre-wrap;font-size:14px">' +
    e.message + '\n\n' + e.stack + '</pre>';
  console.error(e);
}
