# dlock

Distributed-Lock-as-a-Service implemented on Cloudflare Durable Objects. A more correct & scalable implementation of [this HN post](https://news.ycombinator.com/item?id=31764026).

## Usage

```
# Acquire a lock.
# The UUID path segment is the lock ID - choose your own.
$ curl "https://dlock.univalent.net/lock/01899dc0-2742-44f9-9c7b-01830851b299/acquire?ttl=60"
{"lease":1,"deadline":1655572186}

# Another attempt to acquire the same lock within its TTL will fail with HTTP status code 409.
$ curl "https://dlock.univalent.net/lock/01899dc0-2742-44f9-9c7b-01830851b299/acquire?ttl=60"
{"error":"lock is acquired by another client","deadline":1655572186}

# But the previous lock can be renewed with its lease number.
$ curl "https://dlock.univalent.net/lock/01899dc0-2742-44f9-9c7b-01830851b299/acquire?ttl=60&lease=1"
{"lease":1,"deadline":1655572824}

# Release a lock.
$ curl "https://dlock.univalent.net/lock/01899dc0-2742-44f9-9c7b-01830851b299/release?lease=42"
{}

# Releasing a lock with an outdated lease number will fail with HTTP status code 409.
$ curl "https://dlock.univalent.net/lock/01899dc0-2742-44f9-9c7b-01830851b299/release?lease=41"
{"error":"the provided lease is no longer valid"}
```

## System properties

- Provides monotonic lease numbers that can be used as fencing tokens.
- Locks that haven't been used for more than 7 days will be removed.
