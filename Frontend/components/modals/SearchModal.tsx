import Link from "next/link";
import React, { useState, useEffect } from "react";
import { PiAlignLeft, PiBookmark } from "react-icons/pi";
import { topicsService, Topic } from "@/app/topics/topicsService";
import { useMainModal } from "@/stores/modal";

export default function SearchModal() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [query, setQuery] = useState("");
  const { modalClose } = useMainModal();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        const response = await topicsService.getTopics();
        setTopics(response.topics);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="border border-primaryColor/20 rounded-lg bg-white">
        <input
          type="text"
          placeholder="Search your topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="outline-none p-3 bg-transparent text-sm w-full"
          autoFocus
        />
      </div>
      <div className="pt-3">
        <div className="flex flex-col gap-1 justify-start items-start w-full max-h-[300px] overflow-auto ">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 w-full text-center">Loading...</div>
          ) : filteredTopics.length > 0 ? (
            filteredTopics.map(({ id, title }) => (
              <div
                className="flex justify-between items-center gap-2 hover:text-primaryColor hover:bg-primaryColor/10 rounded-xl duration-300 py-3 relative w-full"
                key={id}
              >
                <Link
                  href={`/topics/${id}`}
                  onClick={() => modalClose()}
                  className="flex justify-start items-center gap-2 px-3 w-full"
                >
                  <PiBookmark size={20} className="text-primaryColor opacity-80" />
                  <span className="text-sm font-medium">
                    {title}
                  </span>
                </Link>
              </div>
            ))
          ) : (
             <div className="p-3 text-sm text-gray-500 w-full text-center">
               {query ? `No topics found matching "${query}"` : "No topics found. Create a topic first!"}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
