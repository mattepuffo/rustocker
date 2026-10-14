import {DockerDfItem} from "../components/DockerDfItem.ts";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "is-small" | "is-medium" | "is-large" | "is-fullwidth";
    loading?: boolean;
    error?: string | null;
    data?: string | null;
}

export interface ModalPropsDf {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "is-small" | "is-medium" | "is-large" | "is-fullwidth";
    loading?: boolean;
    error?: string | null;
    data?: DockerDfItem[] | null;
}