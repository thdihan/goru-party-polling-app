import React, { ReactNode } from "react";
import ReactDOM from "react-dom";

type Props = {
    title: string;
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
};

const Modal = ({ children, isOpen }: Props) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200  p-4">
            <div className="w-full  h-full flex justify-center">
                <div className="w-full md:max-w-[40%] h-full  rounded-2xl backdrop-blur-md bg-white/40 border border-white/30 shadow-xl ">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
