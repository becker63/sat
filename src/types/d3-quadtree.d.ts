declare module "d3-quadtree" {
  export type QuadtreeNode<T> =
    | { data: T; next?: QuadtreeNode<T>; length?: undefined }
    | {
        length: number;
        0?: QuadtreeNode<T>;
        1?: QuadtreeNode<T>;
        2?: QuadtreeNode<T>;
        3?: QuadtreeNode<T>;
      };

  export interface Quadtree<T> {
    visit(
      callback: (node: QuadtreeNode<T>, x0: number, y0: number, x1: number, y1: number) => boolean | void,
    ): this;
  }

  export function quadtree<T>(
    data?: T[],
    x?: (d: T) => number,
    y?: (d: T) => number,
  ): Quadtree<T>;
}
