require "test_helper"
require "json"

class SignalRelayTest < ActiveSupport::TestCase
  # Stands in for an open WebSocket: records everything the relay sends it.
  class FakeSocket
    attr_reader :sent

    def initialize
      @sent = []
    end

    def send(payload)
      @sent << JSON.parse(payload)
    end
  end

  setup do
    @relay = SignalRelay.new
    @first = { socket: FakeSocket.new, topics: Set.new }
    @second = { socket: FakeSocket.new, topics: Set.new }
  end

  test "a published message reaches the other subscriber with a client count" do
    subscribe(@first, "room-one")
    subscribe(@second, "room-one")

    publish(@first, "room-one", "from" => "peer-a", "signal" => "sdp-offer")

    assert_equal 1, @second[:socket].sent.size
    assert_equal "peer-a", @second[:socket].sent.first["from"]
    assert_equal "sdp-offer", @second[:socket].sent.first["signal"]
    assert_equal 2, @second[:socket].sent.first["clients"]
  end

  test "a publisher that is also a subscriber receives its own message" do
    subscribe(@first, "room-one")
    subscribe(@second, "room-one")

    publish(@first, "room-one", "from" => "peer-a")

    assert_equal 1, @first[:socket].sent.size
    assert_equal "peer-a", @first[:socket].sent.first["from"]
  end

  test "messages do not leak into another room" do
    subscribe(@first, "room-one")
    subscribe(@second, "room-two")

    publish(@first, "room-one", "from" => "peer-a")

    assert_empty @second[:socket].sent
  end

  test "publishing to a topic with no subscribers sends nothing" do
    subscribe(@first, "room-one")

    publish(@first, "room-empty", "from" => "peer-a")

    assert_empty @first[:socket].sent
    assert_empty @second[:socket].sent
  end

  test "ping is answered with pong" do
    receive(@first, JSON.generate({ "type" => "ping" }))

    assert_equal [{ "type" => "pong" }], @first[:socket].sent
  end

  test "unsubscribing stops delivery" do
    subscribe(@first, "room-one")
    subscribe(@second, "room-one")
    receive(@second, JSON.generate({ "type" => "unsubscribe", "topics" => ["room-one"] }))

    publish(@first, "room-one", "from" => "peer-a")

    assert_empty @second[:socket].sent
    assert_equal 1, @relay.subscriber_count("room-one")
  end

  test "a closed socket is removed from every topic it joined" do
    subscribe(@first, "room-one")
    subscribe(@first, "room-two")
    assert_equal 1, @relay.subscriber_count("room-one")

    @relay.send(:unsubscribed, @first[:socket], @first[:topics])

    assert_equal 0, @relay.subscriber_count("room-one")
    assert_equal 0, @relay.subscriber_count("room-two")
  end

  test "malformed input is ignored instead of raising" do
    assert_nil receive(@first, "not json at all")
    assert_nil receive(@first, JSON.generate({ "type" => "unknown" }))
    assert_nil receive(@first, JSON.generate(["subscribe"]))
    assert_empty @first[:socket].sent
  end

  test "non-string topics are ignored" do
    receive(@first, JSON.generate({ "type" => "subscribe", "topics" => [1, nil, "room-one"] }))

    assert_equal 1, @relay.subscriber_count("room-one")
  end

  private

  def receive(state, raw)
    @relay.receive(state[:socket], state[:topics], raw)
  end

  def subscribe(state, topic)
    receive(state, JSON.generate({ "type" => "subscribe", "topics" => [topic] }))
  end

  def publish(state, topic, extra = {})
    receive(state, JSON.generate({ "type" => "publish", "topic" => topic }.merge(extra)))
  end
end
