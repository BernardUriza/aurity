/**
 * Stub type declarations for @xenova/transformers
 *
 * Stub temporal para compilación TypeScript sin instalar el paquete completo.
 * TODO: Instalar @xenova/transformers cuando se implemente funcionalidad real.
 *
 * Estos tipos permiten compilar código que referencia @xenova/transformers
 * sin tener la librería instalada.
 */

declare module '@xenova/transformers' {
  export interface Pipeline {
    (input: any, options?: any): Promise<any>;
    dispose(): Promise<void>;
  }

  export interface PretrainedOptions {
    model?: string;
    revision?: string;
    quantized?: boolean;
    progress_callback?: (progress: any) => void;
  }

  export function pipeline(
    task: string,
    model?: string | null,
    options?: PretrainedOptions
  ): Promise<Pipeline>;

  export interface Processor {
    (input: any): Promise<any>;
  }

  export class AutoProcessor {
    static from_pretrained(
      model: string,
      options?: PretrainedOptions
    ): Promise<Processor>;
  }

  export class AutoModel {
    static from_pretrained(
      model: string,
      options?: PretrainedOptions
    ): Promise<any>;
  }

  export interface Tensor {
    data: Float32Array | Int32Array | BigInt64Array;
    dims: number[];
    type: string;
  }

  export const env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
    backends: {
      onnx: {
        wasm: {
          numThreads: number;
        };
      };
    };
  };
}
