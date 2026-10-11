export type ContractViewKind = 'manifest' | 'payload' | 'judgment' | 'methodComponent' | 'catalogItem';
export type ContractCoordinate = Readonly<Record<string, string>>;
export interface ContractView {
  readonly kinds: ReadonlyArray<ContractViewKind>;
  contractCoordinate(): ContractCoordinate;
  requiredKeys(kind: ContractViewKind): string[];
  optionalKeys(kind: ContractViewKind): string[];
}
export declare function buildContractView(contract: unknown): ContractView;
export declare const kinds: ReadonlyArray<ContractViewKind>;
export declare function contractCoordinate(): ContractCoordinate;
export declare function requiredKeys(kind: ContractViewKind): string[];
export declare function optionalKeys(kind: ContractViewKind): string[];
