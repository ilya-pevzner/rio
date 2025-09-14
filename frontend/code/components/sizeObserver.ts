import { ComponentBase, ComponentState, DeltaState } from "./componentBase";
import { ComponentId } from "../dataModels";
import { ComponentStatesUpdateContext } from "../componentManagement";
import { pixelsPerRem } from "../app";

export type SizeObserverState = ComponentState & {
    _type_: "SizeObserver-builtin";
    content: ComponentId;
};

export class SizeObserverComponent extends ComponentBase<SizeObserverState> {
    private resizeObserver: ResizeObserver | null = null;

    createElement(context: ComponentStatesUpdateContext): HTMLElement {
        const element = document.createElement("div");
        element.classList.add("rio-size-observer");

        this.resizeObserver = new ResizeObserver(this.sendSize.bind(this));
        this.resizeObserver.observe(element);

        return element;
    }

    onDestruction(): void {
        super.onDestruction();
        if (this.resizeObserver !== null) {
            this.resizeObserver.disconnect();
        }
    }

    updateElement(
        deltaState: DeltaState<SizeObserverState>,
        context: ComponentStatesUpdateContext
    ): void {
        super.updateElement(deltaState, context);

        if (deltaState.content !== undefined) {
            this.replaceOnlyChild(context, deltaState.content);
        }
    }

    private async sendSize(): Promise<void> {
        const rect = this.element.getBoundingClientRect();

        this.sendMessageToBackend({
            type: "resize",
            width: rect.width / pixelsPerRem,
            height: rect.height / pixelsPerRem,
        });
    }
}
