import {For, Show} from "solid-js";
import {ModalPropsDf} from "../models/ModalProps.ts";

export default function ModalDockerSystemDf(props: ModalPropsDf) {
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
                        <div class="table-container">
                            <table class="table is-bordered is-fullwidth is-striped is-hoverable">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Total</th>
                                        <th>Active</th>
                                        <th>Size</th>
                                        <th>Reclaimable</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <For each={props.data}>
                                        {(item) => (
                                            <tr>
                                                <td>{item.Type}</td>
                                                <td>{item.TotalCount}</td>
                                                <td>{item.Active}</td>
                                                <td>{item.Size}</td>
                                                <td>{item.Reclaimable}</td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
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