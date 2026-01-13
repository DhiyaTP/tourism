function startNavVoice(){
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "ml-IN";

  rec.onresult = (e) => {
    const command = e.results[0][0].transcript.toLowerCase();
    handleNavigation(command);
  };

  rec.start();
}

function handleNavigation(command){
  if(command.includes("home")) location.href="/";
  else if(command.includes("destination")) location.href="/destinations";
  else if(command.includes("thiruvananthapuram") || command.includes("trivandrum"))
    location.href="/district/thiruvananthapuram";
  else if(command.includes("kollam")) location.href="/district/kollam";
  else if(command.includes("alappuzha")) location.href="/district/alappuzha";
  else if(command.includes("idukki")) location.href="/district/idukki";
  else if(command.includes("ernakulam")) location.href="/district/ernakulam";
  else if(command.includes("wayanad")) location.href="/district/wayanad";
  else if(command.includes("kannur")) location.href="/district/kannur";
  else if(command.includes("kasaragod")) location.href="/district/kasaragod";
  else if(command.includes("back")) history.back();
}
