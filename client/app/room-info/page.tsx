import RoomDetail from "@/components/room_details/RoomDetail";
import React from "react";

interface RoomInfoPageProps {
  searchParams?: {
    room?: string;
  };
}

const Page = ({ searchParams }: RoomInfoPageProps) => {
  return (
    <div>
      <RoomDetail initialRoom={searchParams?.room} />
    </div>
  );
};

export default Page;
