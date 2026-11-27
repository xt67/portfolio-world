export const defaultBindings={w:'w',a:'a',s:'s',d:'d'};

// Record the source so releasing a touch button or alias cannot cancel another held key.
export class MovementKeys {
  held=new Map();
  press(source,action){this.held.set(source,action);}
  release(source){this.held.delete(source);}
  has(action){for(const value of this.held.values())if(value===action)return true;return false;}
  clear(){this.held.clear();}
}

export function actionForKey(event,bindings,physicalFallback){
  const label=event.key.toLowerCase();
  if(Object.hasOwn(bindings,label))return bindings[label];
  if(physicalFallback&&/^Key[WASD]$/.test(event.code))return event.code.slice(3).toLowerCase();
  return Object.hasOwn(defaultBindings,label)?'':label;
}
