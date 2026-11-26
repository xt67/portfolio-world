const dial = (label, instruction, min, max, step, start, goal, unit) =>
  ({kind:'dial',label,instruction,min,max,step,start,goal,unit});
const sequence = (label, instruction, order) => ({kind:'sequence',label,instruction,order});

export const finalActivities = {
  dhow: dial('Trim the sail','The sail is luffing. Match the harbour pennant at 35° to catch the wind.',0,90,5,65,35,'°'),
  steel: sequence('Assemble the span','Set the bridge deck on its bearings, fit the pins, then lay the tread.', ['Bearings','Pins','Tread']),
};

export function startActivity(panel, activity, finish) {
  panel.hidden=false;
  panel.replaceChildren();
  const title=document.createElement('h3'), hint=document.createElement('p'), controls=document.createElement('div'), feedback=document.createElement('output');
  title.textContent=activity.label;hint.textContent=activity.instruction;
  feedback.setAttribute('aria-live','polite');
  panel.append(title,hint,controls,feedback);
  if(activity.kind==='dial'){
    const slider=document.createElement('input'), button=document.createElement('button');
    slider.type='range';
    for(const key of ['min','max','step']) slider[key]=activity[key];
    slider.value=activity.start;
    slider.setAttribute('aria-label',activity.label);
    function report(){feedback.textContent=slider.value+activity.unit;slider.setAttribute('aria-valuetext',feedback.textContent);}
    slider.oninput=report;report();
    button.textContent='Set position';
    button.onclick=()=>{if(Number(slider.value)===activity.goal)finish();else feedback.textContent=slider.value+activity.unit+' · Adjust to '+activity.goal+activity.unit;};
    controls.append(slider,button);slider.focus();
  } else {
    let index=0;
    const buttons=[...activity.order.slice(1),activity.order[0]].map(label=>{
      const button=document.createElement('button');button.textContent=label;
      button.onclick=()=>{
        if(label!==activity.order[index]){feedback.textContent='Next piece: '+activity.order[index];return;}
        button.disabled=true;
        index++;
        if(index===activity.order.length)finish();
        else {feedback.textContent=activity.order.slice(0,index).join(' → ');buttons.find(other=>!other.disabled)?.focus();}
      };
      controls.append(button);return button;
    });
    buttons[0].focus();
  }
}
