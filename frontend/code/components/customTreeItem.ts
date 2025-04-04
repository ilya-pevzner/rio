import { ComponentBase, ComponentState, DeltaState } from "./componentBase";
import { ComponentId } from "../dataModels";
import { componentsById } from "../componentManagement";

export type CustomTreeItemState = ComponentState & {
    _type_: "CustomTreeItem-builtin";
    expand_button: ComponentId | null;
    content: ComponentId;
    children_container: ComponentId | null;
    is_expanded: boolean;
};

export class CustomTreeItemComponent extends ComponentBase<CustomTreeItemState> {
    createElement(): HTMLElement {
        const element = document.createElement("div");
        element.classList.add("rio-custom-tree-item");

        // Header row for expand button and content
        const headerRowElement = document.createElement("div");
        headerRowElement.classList.add("rio-tree-header-row");
        element.appendChild(headerRowElement);

        if (this.state.expand_button !== null) {
            const buttonElement =
                componentsById[this.state.expand_button].element;
            if (this.state.children_container !== null) {
                buttonElement.classList.add("rio-tree-expand-button");
                buttonElement.addEventListener(
                    "click",
                    this._toggleExpansion.bind(this)
                );
            } else {
                buttonElement.classList.add("rio-tree-expand-placeholder");
            }
            headerRowElement.appendChild(buttonElement);
        }

        if (this.state.content !== null) {
            const contentContainerElement =
                componentsById[this.state.content].element;
            contentContainerElement.classList.add("rio-selectable-item");
            headerRowElement.appendChild(contentContainerElement);
        }

        const childrenContainerElement = document.createElement("div");
        childrenContainerElement.classList.add("rio-tree-children");
        element.appendChild(childrenContainerElement);

        if (this.state.children_container !== null) {
            childrenContainerElement.appendChild(
                componentsById[this.state.children_container].element
            );
        }

        if (this.state.is_expanded != null) {
            this._applyExpansionStyle(element);
        }

        return element;
    }

    updateElement(
        deltaState: DeltaState<CustomTreeItemState>,
        latentComponents: Set<ComponentBase>
    ): void {
        super.updateElement(deltaState, latentComponents);
        const expandButton =
            deltaState.expand_button !== undefined
                ? deltaState.expand_button
                : this.state.expand_button;
        const content =
            deltaState.content !== undefined
                ? deltaState.content
                : this.state.content;
        const childrenContainer =
            deltaState.children_container !== undefined
                ? deltaState.children_container
                : this.state.children_container;

        // Update header row if changed
        if (
            this.state.expand_button !== expandButton ||
            this.state.content !== content
        ) {
            const headerRowElement = this.element.querySelector(
                ".rio-tree-header-row"
            ) as HTMLElement;
            const headerChildren = [expandButton, content].filter(
                (id) => id !== null
            ) as ComponentId[];
            this.replaceChildren(
                latentComponents,
                headerChildren,
                headerRowElement,
                false
            );
        }

        // Update expand button listener if changed
        if (this.state.expand_button !== expandButton) {
            if (this.state.expand_button !== null) {
                const oldButtonElement =
                    componentsById[this.state.expand_button].element;

                oldButtonElement.removeEventListener(
                    "click",
                    this._toggleExpansion.bind(this)
                );
            }
            if (expandButton !== null) {
                const newButtonElement = componentsById[expandButton].element;

                if (childrenContainer !== null) {
                    newButtonElement.classList.add("rio-tree-expand-button");
                    newButtonElement.addEventListener(
                        "click",
                        this._toggleExpansion.bind(this)
                    );
                } else {
                    newButtonElement.classList.add(
                        "rio-tree-expand-placeholder"
                    );
                }
            }
        }

        // Update children container if changed
        if (this.state.children_container !== childrenContainer) {
            const childrenContainerElement = this.element.querySelector(
                ".rio-tree-children"
            ) as HTMLElement;
            const allChildren =
                childrenContainer !== null ? [childrenContainer] : [];
            this.replaceChildren(
                latentComponents,
                allChildren,
                childrenContainerElement,
                false
            );
        }

        // Update expansion state if changed
        this.state.is_expanded = deltaState.is_expanded;
        this._applyExpansionStyle(this.element);
    }

    private _applyExpansionStyle(element): void {
        if (this.state.is_expanded != null) {
            const childrenContainerElement = element.querySelector(
                ".rio-tree-children"
            ) as HTMLElement;
            childrenContainerElement.style.display = this.state.is_expanded
                ? "block"
                : "none";
        }
    }

    private _toggleExpansion(): void {
        this.state.is_expanded = !this.state.is_expanded;
        this._applyExpansionStyle(this.element);

        const expandButtonElement =
            componentsById[this.state.expand_button].element;

        expandButtonElement.textContent = this.state.is_expanded ? "▼" : "▶";

        this.sendMessageToBackend({
            type: "toggleExpansion",
            is_expanded: this.state.is_expanded,
        });
    }
}
