import { useState } from "react";
import Header from "@/components/Header";
import LeaderboardItem from "@/components/LeaderboardItem";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  quizzes?: number;
  correctAnswers?: number;
  accuracy?: number;
  avatar?: number;
};

type UserRank = {
  rank: number;
  name: string;
  score: number;
  avatar: string;
} | null;

import { getApiBase } from "../lib/utils";

const Leaderboard = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("alltime");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<UserRank>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const fetchLeaderboard = async (filterType = "alltime") => {
    try {
      setLoading(true);
      const apiBase = getApiBase();
      const apiFilter = filterType === "alltime" ? "all-time" : filterType;
      const response = await fetch(`${apiBase}/api/auth/leaderboard?filter=${apiFilter}`);
      const data = await response.json();
      setLeaderboardData(data);

      // Get current user's rank
      const token = localStorage.getItem("token");
      if (token) {
        const profileRes = await fetch(`${apiBase}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileData = await profileRes.json();
        
        // Find user's rank in leaderboard
        const rank = data.findIndex((user: LeaderboardEntry) => user.name === profileData.name);
        if (rank !== -1) {
          setUserRank({
            rank: rank + 1,
            name: profileData.name,
            score: filterType === "alltime" ? profileData.totalScore : (data[rank]?.score || 0),
            avatar: profileData.name.charAt(0),
          });
        } else {
          setUserRank(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = leaderboardData.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TopThree = ({ data }: { data: LeaderboardEntry[] }) => (
    <div className="podium">
      {/* Second Place */}
      <div className="podium-player animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="podium-avatar">
          <div className="podium-avatar-circle second">{data[1].name.charAt(0)}</div>
          <div className="podium-medal" style={{ background: "hsla(215, 20%, 65%, 0.3)" }}>
            <Medal style={{ color: "var(--muted-foreground)" }} />
          </div>
        </div>
        <p className="podium-name">{data[1].name.split(" ")[0]}</p>
        <p className="podium-pts">{data[1].score.toLocaleString()} pts</p>
        <div className="podium-bar second"><span className="podium-bar-num second">2</span></div>
      </div>

      {/* First Place */}
      <div className="podium-player animate-fade-in">
        <div className="podium-avatar">
          <div className="podium-avatar-circle first gradient-accent" style={{ color: "var(--accent-foreground)" }}>{data[0].name.charAt(0)}</div>
          <div className="podium-crown"><Crown /></div>
        </div>
        <p className="podium-name first">{data[0].name.split(" ")[0]}</p>
        <p className="podium-pts">{data[0].score.toLocaleString()} pts</p>
        <div className="podium-bar first gradient-primary"><span className="podium-bar-num first">1</span></div>
      </div>

      {/* Third Place */}
      <div className="podium-player animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="podium-avatar">
          <div className="podium-avatar-circle third">{data[2].name.charAt(0)}</div>
          <div className="podium-medal" style={{ background: "hsla(340, 85%, 60%, 0.2)" }}>
            <Award style={{ color: "var(--accent)" }} />
          </div>
        </div>
        <p className="podium-name">{data[2].name.split(" ")[0]}</p>
        <p className="podium-pts">{data[2].score.toLocaleString()} pts</p>
        <div className="podium-bar third"><span className="podium-bar-num third">3</span></div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem", maxWidth: "42rem" }}>
        <div className="leaderboard-page-title animate-fade-in">
          <div className="leaderboard-trophy gradient-primary">
            <Trophy />
          </div>
          <h1>Leaderboard</h1>
          <p>Compete with other players and climb the ranks!</p>
        </div>

        {/* Tabs */}
        <div className="tabs-list">
          {[
            { key: "alltime", label: "All-Time" },
            { key: "weekly", label: "Weekly" },
            { key: "monthly", label: "Monthly" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab-trigger ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="🔍 Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ height: "2.75rem" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
            <p>Loading leaderboard...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
            <p>No players found.</p>
          </div>
        ) : (
          <>
            {searchQuery === "" && filteredData.length >= 3 ? (
              <>
                <TopThree data={filteredData} />

                <div className="card glow-border" style={{ padding: "1rem" }}>
                  {filteredData.slice(3).map((player, index) => (
                    <div key={player.rank} className="animate-fade-in" style={{ animationDelay: `${(index + 3) * 50}ms` }}>
                      <LeaderboardItem {...player} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card glow-border" style={{ padding: "1rem" }}>
                {filteredData.map((player, index) => (
                  <div key={player.rank || index} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <LeaderboardItem {...player} rank={searchQuery !== "" ? index + 1 : player.rank} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Your Rank */}
        <div className="your-rank animate-fade-in">
          <div className="your-rank-inner">
            <div className="your-rank-left">
              <div className="your-rank-avatar">{userRank?.avatar || "?"}</div>
              <div className="your-rank-info">
                <p>{userRank ? userRank.name : "Your Ranking"}</p>
                <small>{userRank ? "See where you stand!" : "Log in to see your rank!"}</small>
              </div>
            </div>
            <div className="your-rank-right">
              <p className="your-rank-num">#{userRank?.rank || "N/A"}</p>
              <p className="your-rank-pts">{userRank ? userRank.score.toLocaleString() : "0"} pts</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
