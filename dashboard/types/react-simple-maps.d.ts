/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?: string | ((...args: any[]) => any);
    projectionConfig?: Record<string, any>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | Record<string, any> | string[];
    children: (props: { geographies: any[] }) => React.ReactNode;
  }

  export interface GeographyProps extends React.SVGProps<SVGPathElement> {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export interface MarkerProps extends React.SVGProps<SVGGElement> {
    coordinates: [number, number];
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
}
