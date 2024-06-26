import { AutonomousOptions, Component } from '../interfaces';
import { parseValue, lifecycle, cloneTemplate } from '../utils';
import { CustomElement } from '../interfaces/custom-element';

export function Autonomous({ selector, ...opts }: AutonomousOptions) {
  return function (target: CustomElement) {
    const disconnected = lifecycle.disconn(target);
    const connected = lifecycle.conn(target);
    const attribute = lifecycle.attr(target);

    (target as Component).selector = selector;

    const styles = (target as Component)?.styles;

    const template = (target as Component)?.template;

    const observed = (target as Component)?.observed;

    target.observedAttributes = observed;

    target.prototype.attributeChangedCallback = function (
      name: string,
      prev: string,
      next: string
    ) {
      this[name] = parseValue(next);
      if (this.attributeChanged) {
        this.attributeChanged(name, prev, parseValue(next));
      }
      attribute.call(name, prev, parseValue(next));
    };

    target.prototype.connectedCallback = function (): void {
      const shadow = this.attachShadow({ mode: opts.mode });

      if (styles || this.styles) {
        shadow.appendChild(styles || this.styles);
      }

      if (template?.content || this.template?.content) {
        shadow.appendChild(cloneTemplate(template || this.template));
      }

      shadow.querySelectorAll('slot').forEach(({ name }) => {
        const assignable = this.querySelector(name);
        if (assignable && !assignable.slot) {
          assignable.setAttribute('slot', name);
        }
      });

      if (this.connected) {
        this.connected.call(this);
      }
      connected.call(this);
    };

    target.prototype.disconnectedCallback = function (): void {
      disconnected.call(this);
    };

    customElements.define(selector, target);
  };
}
