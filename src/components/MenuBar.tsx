import {createSignal, onMount, onCleanup, createEffect} from "solid-js";
import {FaSolidAngleDown} from "solid-icons/fa";
import ModalDockerSystemDf from "./ModalDockerSystemDf.tsx";
import {invoke} from "@tauri-apps/api/core";
import {DockerDfItem} from "./DockerDfItem.ts";

export default function MenuBar() {
    const [isActive, setIsActive] = createSignal(false);
    const [isOpen, setIsOpen] = createSignal(false);
    const [data, setData] = createSignal<DockerDfItem[]>([]);
    const [inspectLoading, setInspectLoading] = createSignal(false);
    const [inspectError, setInspectError] = createSignal<string | null>(null);

    let dropdownRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (!isOpen()) return;

        setData([]);
        setInspectError(null);
        setInspectLoading(true);

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        window.addEventListener("keydown", handleKey);
        onCleanup(() => window.removeEventListener("keydown", handleKey));

        invoke<string>("docker_system_df")
            .then((result) => {
                const parsed: DockerDfItem[] = JSON.parse(result);
                setData(parsed);
            })
            .catch((err) => {
                setInspectError(String(err));
            })
            .finally(() => {
                setInspectLoading(false);
            });
    });

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
                setIsActive(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    });

    const quitApp = async () => {
        const {exit} = await import('@tauri-apps/plugin-process');
        await exit(0);
    }

    return (
        <>
            <div class={`dropdown ${isActive() ? "is-active" : ""}`} ref={dropdownRef}>
                <div class="dropdown-trigger">
                    <button class="button"
                            aria-haspopup="true"
                            aria-controls="dropdown-menu"
                            onClick={() => setIsActive(!isActive())}>

                        <span>File</span>
                        <span class="icon is-small">
                            <FaSolidAngleDown/>
                        </span>
                    </button>
                </div>

                <div class="dropdown-menu" id="dropdown-menu" role="menu">
                    <div class="dropdown-content">
                        <a href="#" class="dropdown-item" onClick={() => {
                            setIsOpen(true);
                            setIsActive(!isActive());
                        }}>
                            Docker System Df
                        </a>
                        <hr class="dropdown-divider"/>
                        <a href="#" class="dropdown-item" onClick={() => quitApp()}>Quit</a>
                    </div>
                </div>
            </div>

            <ModalDockerSystemDf isOpen={isOpen()}
                                 onClose={() => setIsOpen(false)}
                                 title="Docker System DF"
                                 size="is-fullwidth"
                                 loading={inspectLoading()}
                                 error={inspectError()}
                                 data={data()}
            />
        </>
    );
}