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
        <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-lg dark:bg-dark-secondary">
                {/* <Header
              name={name}
              buttonComponent={
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-primary text-white hover:bg-blue-600"
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              }
              isSmallText
            /> */}
                {children}
            </div>
        </div>,
        document.body
    );
    // return (
    //     // <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-80 p-4">
    //     //     <div className="w-full  h-full flex justify-center">
    //     //         <div className="w-full md:max-w-[40%] h-full bg-white rounded-2xl shadow-lg border border-gray-200">
    //     //             {children}
    //     //         </div>
    //     //     </div>
    //     // </div>

    // );
};

export default Modal;
