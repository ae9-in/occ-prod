import { Club } from "@/lib/dataProvider";
import { ArrowRight, Users, Tag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ImageWithFallback from "@/components/ImageWithFallback";

export default function ClubCard({ club }: { club: Club }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useUser();
  const safeClubLogo = club.logo || "/globe.svg";

  return (
    <div className="bg-white border-4 border-black p-6 md:p-8 flex flex-col justify-between group overflow-hidden relative shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#1d2cf3] transition-all h-full">
      {/* Category Tag */}
      <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-black uppercase text-[10px] flex items-center gap-1 border-b-4 border-l-4 border-black group-hover:bg-brutal-blue transition-colors z-20">
        <Tag className="w-3 h-3" /> {club.category}
      </div>

      <div className="z-10">
        <div className="relative mb-6">
          <div className="w-20 h-20 overflow-hidden rounded-[1.3rem] border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
            <ImageWithFallback
              src={safeClubLogo}
              fallbackSrc="/globe.svg"
              alt={club.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          </div>
        </div>
        <h3 className="text-3xl font-black text-black leading-none mb-4 uppercase group-hover:text-brutal-blue transition-colors">{club.name}</h3>
        <p className="text-black font-bold text-lg border-l-4 border-brutal-blue pl-4 mb-6 leading-snug">{club.description}</p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2 text-gray-400 font-black uppercase text-xs">
          <Users className="w-4 h-4" /> {(club.membersCount ?? 0) > 0 ? `${club.membersCount}+ Members` : "New Club"}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              router.push(`/login?next=${encodeURIComponent(pathname ?? `/clubs/${club.id}`)}`);
              return;
            }
            router.push(`/clubs/${club.id}`);
          }}
          className="bg-black text-white p-3 border-2 border-black shadow-[3px_3px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
