import RoomDetail from "@/components/room_details/RoomDetail";
import React from "react";

interface RoomInfoPageProps {
  searchParams: Promise<{
    room?: string;
  }>;
}

const Page = async ({ searchParams }: RoomInfoPageProps) => {
  const param = await searchParams;
  return (
    <div>
      <RoomDetail initialRoom={param?.room} />
    </div>
  );
};

export default Page;
