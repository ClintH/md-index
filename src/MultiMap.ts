export class MultiMap<V> {
  map:Map<string,V[]> = new Map();
  constructor() {

  }

  isEmpty() {
    return (this.map.size == 0)
  }

  _set(key:string, value:V) {
    if (!this.map.has(key)) {
      this.map.set(key, []);
    }
    let e = this.map.get(key);
    e?.push(value);
  }

  has(key:string):boolean {
    return this.map.has(key);
  }
  
  set(key:string, ...value:V[]) {
    for (const v of value) {
      this._set(key,v);
    }
  }

  count(key:string):number {
    let e = this.map.get(key);
    if (e !== undefined) return e.length;
    return 0;
  }

  get(key:string): V[]|undefined {
    return this.map.get(key);
  }

  keys():string[] {
    return Array.from(this.map.keys());
  }

  keysAndCounts():[string,number][] {
    const keys = this.keys();
    const r = keys.map(k => [k,this.count(k)]) as [string,number][];
    return r;
  }

  merge(other:MultiMap<V>) {
    const keys = other.keys();
    for (const key of keys) {
      const data = other.get(key);
      if (data !== undefined) this.set(key, ...data);
    }
  }
}

export function sortByAlpha<V>(map:MultiMap<V>):string[] {
  let tags = map.keys();
  return tags.sort();
}

export function sortBySize<V>(map:MultiMap<V>):string[] {
  const t = map.keysAndCounts();
  t.sort((aR,bR)=> {
    const a = aR[1];
    const b = bR[1]; 
    if (a>b) return -1; 
    else if (a<b) return 1;
    return 0;
  });
  return t.map(tagAndCount => tagAndCount[0]);
}