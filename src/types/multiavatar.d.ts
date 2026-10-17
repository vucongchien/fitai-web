declare module "@multiavatar/multiavatar/esm" {
  export default function multiavatar(
    string: string,
    sansEnv?: boolean,
    ver?: Record<string, unknown>,
  ): string;
}

declare module "@multiavatar/multiavatar" {
  export default function multiavatar(
    string: string,
    sansEnv?: boolean,
    ver?: Record<string, unknown>,
  ): string;
}
