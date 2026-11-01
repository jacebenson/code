# frozen_string_literal: true
#
# Signaling relay for the peer-to-peer collaboration editor.
#
# Peers find each other through this endpoint and then exchange document updates
# directly over WebRTC. The relay stores nothing: it keeps a map of topic to
# connected sockets and forwards the messages peers send each other.
#
# Protocol (matching the y-webrtc signaling server):
#   { "type": "subscribe",   "topics": ["<room>"] }
#   { "type": "unsubscribe", "topics": ["<room>"] }
#   { "type": "publish",     "topic": "<room>", ... }  -> forwarded to the other
#                                                         subscribers, with a
#                                                         "clients" count added
#   { "type": "ping" }                                -> { "type": "pong" }

require "json"
require "set"
require "faye/websocket"

Faye::WebSocket.load_adapter("puma") if defined?(Puma)

class SignalRelay
  PING_INTERVAL = 30

  def initialize
    @topics = {}
    @lock = Mutex.new
  end

  def call(env)
    return [200, { "content-type" => "text/plain" }, ["okay"]] unless Faye::WebSocket.websocket?(env)

    socket = Faye::WebSocket.new(env, nil, ping: PING_INTERVAL)
    subscriptions = Set.new

    socket.on(:message) { |event| receive(socket, subscriptions, event.data) }
    socket.on(:close) do
      unsubscribed(socket, subscriptions)
      subscriptions.clear
      socket = nil
    end

    socket.rack_response
  end

  # Message entry point. Public so the protocol can be tested without a socket.
  def receive(socket, subscriptions, raw)
    message = JSON.parse(raw.to_s)
    return unless message.is_a?(Hash)

    case message["type"]
    when "subscribe" then subscribe(socket, subscriptions, message)
    when "unsubscribe" then unsubscribe(socket, subscriptions, message)
    when "publish" then relay(message)
    when "ping" then socket.send(JSON.generate({ "type" => "pong" }))
    end
  rescue JSON::ParserError, RuntimeError
    nil
  end

  def subscriber_count(topic)
    @lock.synchronize { (@topics[topic] || Set.new).size }
  end

  private

  def subscribe(socket, subscriptions, message)
    @lock.synchronize do
      Array(message["topics"]).each do |topic|
        next unless topic.is_a?(String)

        (@topics[topic] ||= Set.new) << socket
        subscriptions << topic
      end
    end
  end

  def unsubscribe(socket, subscriptions, message)
    @lock.synchronize do
      Array(message["topics"]).each do |topic|
        @topics[topic]&.delete(socket)
        subscriptions.delete(topic)
      end
    end
  end

  def unsubscribed(socket, subscriptions)
    @lock.synchronize do
      subscriptions.each do |topic|
        peers = @topics[topic]
        next unless peers

        peers.delete(socket)
        @topics.delete(topic) if peers.empty?
      end
    end
  end

  def relay(message)
    topic = message["topic"]
    return unless topic.is_a?(String)

    receivers = @lock.synchronize { (@topics[topic] || Set.new).to_a }
    payload = JSON.generate(message.merge("clients" => receivers.size))
    receivers.each do |peer|
      peer.send(payload)
    rescue StandardError
      nil
    end
  end
end
