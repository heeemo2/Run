function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  speechSynthesis.speak(msg);
}
