
    export class ActionEvent<T> {
        get value(): T {
            return this._value;
        }
        constructor(private _value:T=null) {

        }
    }

    export interface ActionEventListener<T>{
        (ae:ActionEvent<T>):void;
    }

    export class Action<T> {
        get value(): T {
            return this._value;
        }

        private _name:string;
        private _value:T
        _disabled=true;
        private _onAction:ActionEventListener<T>;
        listeners:Array<ActionEventListener<T>>;
        private controls:HTMLInputElement[];

        constructor(name:string,value:T=null) {
            this._name = name;
            this._value=value
            this.listeners = new Array<ActionEventListener<T>>();
            this.controls = [];
        }

        get name():string {
            return this._name;
        }


        get onAction():ActionEventListener<T> {
            return this._onAction;
        }

        set onAction(value:ActionEventListener<T>) {
            this._onAction = value;
        }

        protected  createActionEvent(value: T=null):ActionEvent<T> {
            // default:
            return new ActionEvent(value);
        }

        perform(value: T=null):void {
            this._value=value
            if (!this.disabled && this._onAction) {
                let ae=this.createActionEvent(value)
                this._onAction(ae);
            }
        }

        set disabled(disabled:boolean) {
            this._disabled = disabled;
            for (let c of this.controls) {
                c.disabled = this._disabled;
            }
            //let disStr=this.disabled?"disabled":"enabled";
            //console.log(this._name+": "+disStr);
        }

        get disabled():boolean {
            return this._disabled;
        }

        addControl(ctrl: HTMLInputElement, actionEventName?: string) {
            if (ctrl) {
                if (this.controls.indexOf(ctrl) < 0) {
                    ctrl.disabled = this.disabled;
                    this.controls.push(ctrl);
                    if (actionEventName) {
                        ctrl.addEventListener(actionEventName, (e) => {
                            this.perform();
                        });
                    }
                }
            }
        }

        removeControl(ctrl:HTMLInputElement) {
            var i = this.controls.indexOf(ctrl);
            if (i >= 0) {
                this.controls = this.controls.splice(i, 1);
            }
        }
    }

