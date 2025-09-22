import dynamic from "next/dynamic";

const ModeratorEntryPage = dynamic(() => import("./ModeratorEntryClient"), {
  ssr: false,
});

const mEntryPage = ({ searchParams }) => {
  return (
    <div>
      <ModeratorEntryPage searchParams={searchParams} />
    </div>
  );
};

export default mEntryPage;
