const themeButton=document.createElement("button");
themeButton.className="theme-toggle";
themeButton.type="button";
themeButton.id="theme-toggle";
const topActions=document.querySelector(".top-actions");
topActions.insertBefore(themeButton,topActions.firstChild);

const themeOrder=["studio","luma"];
function applyTheme(theme){
  const selected=themeOrder.includes(theme)?theme:"studio";
  document.body.classList.remove("theme-studio","theme-arcade","theme-luma");
  document.body.classList.add(`theme-${selected}`);
  const next=themeOrder[(themeOrder.indexOf(selected)+1)%themeOrder.length];
  const symbols={studio:"◐",luma:"✦"};
  const labels={studio:"Studio",luma:"Luma"};
  themeButton.innerHTML=`<span aria-hidden="true">${symbols[next]}</span><b>${labels[next]} theme</b>`;
  themeButton.setAttribute("aria-label",`Switch to ${labels[next]} theme`);
  themeButton.title=`Switch to ${labels[next]} theme`;
}

let savedTheme="studio";
try{
  savedTheme=localStorage.getItem("neurovision-theme-v1")||"studio";
  if(savedTheme==="arcade"){savedTheme="studio";localStorage.setItem("neurovision-theme-v1",savedTheme)}
}catch{}
applyTheme(savedTheme);
themeButton.addEventListener("click",()=>{
  const current=document.body.classList.contains("theme-luma")?"luma":"studio";
  const next=themeOrder[(themeOrder.indexOf(current)+1)%themeOrder.length];
  applyTheme(next);
  try{localStorage.setItem("neurovision-theme-v1",next)}catch{}
});
