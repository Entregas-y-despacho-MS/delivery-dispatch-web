import truckLogo from "@/assets/flash-pack-truck.png";

export function FlashPackLogo() {
  return (
    <img
      src={truckLogo}
      alt=""
      className="h-9 w-12 shrink-0 object-contain group-data-[collapsible=icon]:w-10"
      aria-hidden="true"
    />
  );
}
