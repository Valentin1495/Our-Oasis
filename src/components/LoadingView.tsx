import { Loader, type LoaderProps } from "@toss/tds-mobile";

interface Props {
  label?: string;
  type?: LoaderProps["type"];
}

export function LoadingView({
  label = "불러오는 중...",
  type = "primary",
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "240px",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <Loader size="large" type={type} label={label} />
    </div>
  );
}
