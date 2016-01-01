# Typescript Sass

## What is this?
This is an experiment that came about from learning a bit of Angular2 and wanting to
use sass in component styles. The idea behind this module is that it watches your
project for changes in sass files, but instead of making on big sass file it compiles
those files into typescript files that can be imported into other typescript files.

If your loader supports it you can technically import raw text files and use those
in say, an Angular2 component, but the typescript compiler is going to yell at you
since a raw css text file isn't a typescript module. Still not sure what I mean?

Take the following example Angular2 component:

```typescript
import {Component} from 'angular2/core';
import {DevicesService} from './devices.service';
import mainStyles from "./main.styles";

@Component({
    selector: 'device-list',
    template: `
      <h1>List of devices</h1>
      <ul>
        <li *ngFor="#device of devices">{{device.name}}</li>
      </ul>
    `,
    styles: [mainStyles]
})

export class DeviceListComponent { 
  public devices
  
  constructor(
    private _service: DevicesService
  ){}
  
  ngOnInit() {
    this._service.getDevices().then((devices)=>{
      this.devices = devices
    })
  }
}
```

`mainStyles` is a sass file in the `devices` component directory.

This module makes the attempt to take that sass file and generate a module that
will work in this situation and satisfy the typescript compiler.

Original main.styles.sass file:

```sass
ul
  list-style: none
li
  display: inline
  a 
    color: blue
```

and the generated main.styles.ts file:

```typescript
export default `
ul {
  list-style: none; }

li {
  display: inline; }
  li a {
    color: blue; }

`
```

Sass imports are also supported currently


# Usage
I've been using this with the concurrently module in my project

package.js

```json
"scripts": {
  "tsc": "tsc",
  "tsc:w": "tsc -w",
  "lite": "lite-server",
  "tsSass": "ts-sass",
  "start": "concurrent \"npm run tsc:w\" \"npm run lite\" \"npm run tsSass\""
},
```

For Basic configuration you can include a `tsSassConfig.json` file in your project root:

```json
{
  "sassDir": "app",
  "sassSubDir": "sass"
}
```

`sassDir` - Indicates that main directory to watch for sass files. I point this towards
my angular `app` directory where my components live. This should not include `node_modules`
it's just using `fs.watch` so there isn't a great way to exclude node_modules.

`sassSubDir` - Indicates if you want your sass files in a separate directory within
you component directories. I've been experimenting with a `/sass` directory to reduce clutter.
If this option isn't set then the compiled `.ts` files will be placed in the same directory
as the original `.sass` files.

# Wat, no tests?!
Yea, its just an experiment at this point and it's small enough where I'm not 
too worried yet. If there is interest I might make this a bit better, like supporting
other stuff then just sass (less/haml/jade/etc)