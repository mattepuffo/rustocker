import {Show} from "solid-js";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "is-small" | "is-medium" | "is-large" | "is-fullwidth";
    loading?: boolean;
    error?: string | null;
    data?: string | null;
}

export default function ModalInfo(props: ModalProps) {
    return (
        <div class={`modal ${props.isOpen ? "is-active" : ""}`}
             onClick={(e) => e.stopPropagation()}>

            <div class="modal-background" onClick={props.onClose}></div>

            <div class={`modal-card ${props.size ?? ""}`}>
                <header class="modal-card-head">
                    <p class="modal-card-title">{props.title ?? "Info Container"}</p>

                    <button class="delete"
                        aria-label="close"
                        onClick={props.onClose}></button>
                </header>

                <section class="modal-card-body">
                    <Show when={props.loading}>
                        <div class="has-text-centered py-6">
                            <button class="button is-loading is-ghost is-large"></button>
                            <p class="mt-3 has-text-grey">Caricamento inspect...</p>
                        </div>
                    </Show>

                    <Show when={props.error}>
                        <div class="notification is-danger is-light">
                            {props.error}
                        </div>
                    </Show>

                    <Show when={props.data && !props.loading}>
                        <pre class="is-size-7" style={{"max-height": "60vh", overflow: "auto"}}>
                          {props.data}
                        </pre>
                    </Show>
                </section>

                <footer class="modal-card-foot is-justify-content-flex-end">
                    <button class="button" onClick={props.onClose}>
                        Chiudi
                    </button>
                </footer>
            </div>
        </div>
    );
}