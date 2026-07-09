/**
 * Browse society polls, open one to see options and results,
 * and cast a vote when voting is open and the resident has not voted yet.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";

import { apiGet, apiPost } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function ResidentPollsPage() {
  const [polls, setPolls] = useState([]);
  const [detail, setDetail] = useState(null); // full poll loaded for voting / results
  const [choice, setChoice] = useState(""); // selected option before submit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all polls (open and closed) for the list view.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/polls?limit=50&status=all");
      setPolls(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Fetch one poll with options, results, and whether this resident can vote.
  async function openPoll(id) {
    setError(null);
    setChoice("");
    try {
      const p = await apiGet(`/polls/${id}`);
      setDetail(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load poll");
    }
  }

  // Submit the chosen option, then reload poll detail and the poll list.
  async function submitVote(e) {
    e.preventDefault();
    if (!detail || !choice) return;
    setError(null);
    try {
      await apiPost("/votes", { pollId: detail.id, selectedOption: choice });
      const p = await apiGet(`/polls/${detail.id}`);
      setDetail(p);
      setChoice("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Polls & voting</Typography>
      <Typography variant="body2" color="text.secondary">
        Vote on open society matters and elections and see results when a poll closes.
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(polls.length, "poll")}
      </Typography>

      <Stack spacing={2}>
        {polls.map((p) => (
          <Card key={p.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">{p.question}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {new Date(p.startDate).toLocaleString()} → {new Date(p.endDate).toLocaleString()} · {p.status}
              </Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={() => openPoll(p.id)}>
                Open / vote
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && polls.length === 0 && (
          <Typography color="text.secondary">No polls.</Typography>
        )}
      </Stack>

      {detail && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {detail.question}
            </Typography>
            {detail.myVote && (
              <Typography variant="body2" color="success.main" gutterBottom>
                Your vote: <strong>{detail.myVote.selectedOption}</strong>
              </Typography>
            )}
            {detail.results && Object.keys(detail.results).length > 0 && (
              <Typography variant="body2" component="div" sx={{ mb: 2 }}>
                Results:
                <ul style={{ marginTop: 4 }}>
                  {Object.entries(detail.results).map(([opt, n]) => (
                    <li key={opt}>
                      {opt}: <strong>{n}</strong>
                    </li>
                  ))}
                </ul>
                Total votes: {detail.totalVotes ?? 0}
              </Typography>
            )}
            {detail.canVote ? (
              <form onSubmit={submitVote}>
                <FormControl component="fieldset">
                  <RadioGroup value={choice} onChange={(ev) => setChoice(ev.target.value)}>
                    {detail.options.map((o) => (
                      <FormControlLabel key={o} value={o} control={<Radio />} label={o} />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={!choice}>
                  Submit vote
                </Button>
              </form>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {detail.votingOpen === false && detail.status === "Open"
                  ? "Voting is not open yet, or the deadline has passed."
                  : detail.status === "Closed"
                    ? "Poll is closed."
                    : detail.myVote
                      ? "You have already cast your vote."
                      : "You cannot vote in this poll right now."}
              </Typography>
            )}
            <Button size="small" sx={{ mt: 2 }} onClick={() => setDetail(null)}>
              Close detail
            </Button>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
