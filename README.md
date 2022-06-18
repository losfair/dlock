# dlock

Distributed-Lock-as-a-Service implemented on Cloudflare Durable Objects. A more correct & scalable implementation of [this HN post](https://news.ycombinator.com/item?id=31764026).

## Usage

```
# Acquire a lock.
# The UUID path segment is the lock ID - choose your own.
$ curl "https://dlock.univalent.net/01899dc0-2742-44f9-9c7b-01830851b299/acquire?ttl=60"
{"lease":1,"deadline":1655572186}

# Release a lock.
$ curl "https://dlock.univalent.net/01899dc0-2742-44f9-9c7b-01830851b299/release?lease=1"
{}
```
