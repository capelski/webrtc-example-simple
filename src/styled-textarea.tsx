import React from 'react';

export const StyledTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (
    props,
) => {
    return <textarea rows={3} style={{ marginBottom: 16, width: '100%' }} {...props}></textarea>;
};
