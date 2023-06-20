import React, { forwardRef } from 'react';
import { videoSize } from './constants';

export const StyledVideo = forwardRef(
    (
        props: React.VideoHTMLAttributes<HTMLVideoElement>,
        ref: React.ForwardedRef<HTMLVideoElement>,
    ) => {
        return (
            <video
                ref={ref}
                {...props}
                style={{
                    backgroundColor: 'lightgrey',
                    maxHeight: '53.44vw',
                    maxWidth: '95vw',
                    ...videoSize,
                }}
            />
        );
    },
);
