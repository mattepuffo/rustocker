import {createSignal, onMount, onCleanup, createEffect} from "solid-js";
import {FaSolidAngleDown} from "solid-icons/fa";
import ModalDockerSystemDf from "./ModalDockerSystemDf.tsx";
import {invoke} from "@tauri-apps/api/core";
import {DockerDfItem} from "./DockerDfItem.ts";
import ModalClean from "./ModalClean.tsx";
import ModalStats from "./ModalStats.tsx";

export default function MenuBar() {
    const [isActive, setIsActive] = createSignal(false);
    const [isOpen, setIsOpen] = createSignal(false);
    const [data, setData] = createSignal<DockerDfItem[]>([]);
    const [inspectLoading, setInspectLoading] = createSignal(false);
    const [inspectError, setInspectError] = createSignal<string | null>(null);
    const [isOpenInfo, setIsOpenInfo] = createSignal(false);
    const [modalCleanColor, setModalCleanColor] = createSignal<string | null>(null);
    const [dataClean, setDataClean] = createSignal<string | null>(null);
    const [inspectLoadingClean, setInspectLoadingClean] = createSignal(false);
    const [inspectErrorClean, setInspectErrorClean] = createSignal<string | null>(null);
    const [isOpenStats, setIsOpenStats] = createSignal(false);

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

    const cleanupDocker = async () => {
        setDataClean('');
        setInspectErrorClean(null);
        setInspectLoadingClean(true);
        setIsOpenInfo(true);

        invoke<string>("cleanup_docker")
            .then((result) => {
                setModalCleanColor('has-background-primary has-text-primary-invert');
                setDataClean(String(result));
            })
            .catch((err) => {
                setModalCleanColor('has-background-danger has-text-danger-invert');
                setInspectErrorClean(String(err));
            })
            .finally(() => {
                setInspectLoadingClean(false);
            });
    }

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

                        <a href="#" class="dropdown-item" onClick={() => {
                            setIsActive(!isActive());
                            cleanupDocker();
                        }}>
                            Docker Clean
                        </a>

                        <a href="#" class="dropdown-item" onClick={() => {
                            setIsOpenStats(true);
                        }}>
                            Docker Stats
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
                                 data={data()}/>

            <ModalClean isOpen={isOpenInfo()}
                        onClose={() => setIsOpenInfo(false)}
                        title="Clean"
                        size="is-fullwidth"
                        loading={inspectLoadingClean()}
                        error={inspectErrorClean()}
                        data={dataClean()}
                        colorCard={modalCleanColor()}/>

            <ModalStats isOpen={isOpenStats()}
                        onClose={() => setIsOpenStats(false)}
                        title="Stats"
                        size="is-fullwidth"/>
        </>
    );
}