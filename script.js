function sendToPython() {
  if (window.python) {
    window.python("HELLO_FROM_JS");
    console.log("HELLO");
  } else {
    console.log("Python ikke klar enda!");
  }
}
window.sendToPython = sendToPython;
